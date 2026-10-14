"""Yahoo Finance client and request scheduler.

No Home Assistant imports here, so the same code runs in HA and in the
live test script. All throttling rules live in this file.
"""
from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Callable

import aiohttp

_LOGGER = logging.getLogger(__name__)

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
HOSTS = ("query1.finance.yahoo.com", "query2.finance.yahoo.com")

# Hard floors, in seconds. Enforced here no matter what a card asks for.
MIN_OPEN = 180
MIN_CLOSED = 600
DEFAULT_INTERVAL = 300

# How long a symbol stays tracked after the last card asked for it.
TRACK_TTL = 30 * 60

# Chart ranges: (yahoo range, yahoo interval, max age in seconds while open)
RANGES: dict[str, tuple[str, str, int | None]] = {
    "1D": ("1d", "5m", None),  # None = follows the quote refresh interval
    "5D": ("5d", "15m", 15 * 60),
    "1M": ("1mo", "60m", 60 * 60),
    "3M": ("3mo", "1d", 24 * 3600),
    "1Y": ("1y", "1d", 24 * 3600),
}
BETA_MAX_AGE = 24 * 3600
BACKOFF_START = 60
BACKOFF_MAX = 3600

QUOTE_FIELDS = (
    "symbol,shortName,longName,fullExchangeName,exchange,currency,marketState,"
    "regularMarketPrice,regularMarketChange,regularMarketChangePercent,"
    "regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,"
    "regularMarketPreviousClose,regularMarketVolume,regularMarketTime,"
    "averageDailyVolume3Month,marketCap,trailingPE,epsTrailingTwelveMonths,"
    "fiftyTwoWeekHigh,fiftyTwoWeekLow,postMarketPrice,postMarketChange,"
    "postMarketChangePercent,preMarketPrice,preMarketChange,preMarketChangePercent,"
    "exchangeTimezoneName,gmtOffSetMilliseconds,quoteType"
)


class RateLimited(Exception):
    """Yahoo answered 429."""


def clamp_interval(seconds: int | float | None, market_open: bool) -> int:
    """Return the refresh interval actually used for a requested value."""
    floor = MIN_OPEN if market_open else MIN_CLOSED
    try:
        s = int(seconds) if seconds else DEFAULT_INTERVAL
    except (TypeError, ValueError):
        s = DEFAULT_INTERVAL
    return max(s, floor)


@dataclass
class _Sym:
    interval: int = DEFAULT_INTERVAL
    last_seen: float = 0.0
    quote: dict | None = None
    quote_ts: float = 0.0
    charts: dict = field(default_factory=dict)  # range -> (ts, data, fetched_closed)
    beta: float | None = None
    beta_ts: float = 0.0


class YahooClient:
    """Low level HTTP with cookie + crumb and 429 backoff."""

    def __init__(self, session: aiohttp.ClientSession, clock: Callable[[], float] = time.time) -> None:
        self._session = session
        self._crumb: str | None = None
        self._clock = clock
        self._backoff = 0
        self.backoff_until = 0.0
        self.calls: list[tuple[float, str]] = []  # (time, kind) for stats/tests
        self._crumb_lock = asyncio.Lock()

    async def _ensure_crumb(self, force: bool = False) -> str:
        async with self._crumb_lock:
            if self._crumb and not force:
                return self._crumb
            try:
                async with self._session.get("https://fc.yahoo.com", headers={"User-Agent": UA}, allow_redirects=True) as r:
                    await r.read()  # 404 is normal; we only want the cookie
            except aiohttp.ClientError as err:
                _LOGGER.debug("fc.yahoo.com: %s", err)
            last = None
            for host in HOSTS:
                url = f"https://{host}/v1/test/getcrumb"
                async with self._session.get(url, headers={"User-Agent": UA}) as r:
                    self.calls.append((self._clock(), "crumb"))
                    if r.status == 429:
                        self._hit_429()
                        raise RateLimited
                    text = (await r.text()).strip()
                    if r.status == 200 and text and "<" not in text:
                        self._crumb = text
                        return text
                    last = r.status
            raise aiohttp.ClientError(f"no crumb (status {last})")

    def _hit_429(self) -> None:
        self._backoff = min(BACKOFF_MAX, self._backoff * 2 if self._backoff else BACKOFF_START)
        self.backoff_until = self._clock() + self._backoff
        _LOGGER.warning("Yahoo rate limit hit, backing off %ss", self._backoff)

    async def get(self, path: str, params: dict, kind: str, crumb: bool = True) -> dict:
        if self._clock() < self.backoff_until:
            raise RateLimited
        for attempt in range(2):
            p = dict(params)
            if crumb:
                p["crumb"] = await self._ensure_crumb(force=attempt > 0)
            last_err: Exception | None = None
            for host in HOSTS:
                try:
                    async with self._session.get(
                        f"https://{host}{path}", params=p, headers={"User-Agent": UA},
                        timeout=aiohttp.ClientTimeout(total=20),
                    ) as r:
                        self.calls.append((self._clock(), kind))
                        if r.status == 429:
                            self._hit_429()
                            raise RateLimited
                        if r.status in (401, 403) and crumb:
                            last_err = PermissionError(r.status)
                            break  # refresh crumb
                        if r.status >= 500:
                            last_err = aiohttp.ClientError(f"{host} {r.status}")
                            continue
                        data = await r.json(content_type=None)
                        if r.status >= 400:
                            raise aiohttp.ClientError(f"{r.status}: {str(data)[:200]}")
                        self._backoff = 0
                        return data
                except (aiohttp.ClientError, asyncio.TimeoutError) as err:
                    last_err = err
                    continue
            if not isinstance(last_err, PermissionError):
                raise last_err or aiohttp.ClientError("request failed")
        raise aiohttp.ClientError("crumb rejected twice")


class StockHub:
    """Tracks symbols requested by cards and fetches as little as possible."""

    def __init__(self, session: aiohttp.ClientSession, clock: Callable[[], float] = time.time) -> None:
        self.client = YahooClient(session, clock)
        self._clock = clock
        self.symbols: dict[str, _Sym] = {}
        self._quote_lock = asyncio.Lock()
        self._chart_locks: dict[tuple[str, str], asyncio.Lock] = {}
        self.listeners: list[Callable[[set[str]], None]] = []
        self.lookups: dict[str, tuple[float, dict | None]] = {}

    # ---------- bookkeeping ----------
    def track(self, symbol: str, interval: int | None = None) -> _Sym:
        symbol = symbol.upper().strip()
        s = self.symbols.get(symbol)
        if s is None:
            s = self.symbols[symbol] = _Sym()
        if interval:
            s.interval = int(interval)
        s.last_seen = self._clock()
        return s

    def active(self) -> dict[str, _Sym]:
        now = self._clock()
        return {k: v for k, v in self.symbols.items() if now - v.last_seen < TRACK_TTL}

    def is_open(self, symbol: str | None = None) -> bool:
        syms = [self.symbols[symbol]] if symbol in self.symbols else list(self.symbols.values())
        states = [s.quote.get("marketState") for s in syms if s.quote]
        if not states:
            return True  # unknown: assume open, i.e. use the stricter 3 min floor
        return any(st == "REGULAR" for st in states)

    def effective_interval(self, symbol: str) -> int:
        s = self.symbols[symbol]
        return clamp_interval(s.interval, self.is_open(symbol))

    # ---------- quotes ----------
    def _due(self, now: float) -> list[str]:
        return [k for k, v in self.active().items() if v.quote is None or now - v.quote_ts >= self.effective_interval(k)]

    async def refresh_quotes(self, force_symbols: list[str] | None = None) -> bool:
        """One batched v7 call for every active symbol, if any is due."""
        async with self._quote_lock:
            now = self._clock()
            due = self._due(now)
            if force_symbols:
                due += [s for s in force_symbols if self.symbols[s].quote is None]
            if not due:
                return False
            # Batch everything that is at least halfway to its next refresh, so
            # cards with similar intervals share one request.
            batch = sorted({
                k for k, v in self.active().items()
                if k in due or now - v.quote_ts >= self.effective_interval(k) / 2
            } | set(due))
            data = await self.client.get(
                "/v7/finance/quote", {"symbols": ",".join(batch), "fields": QUOTE_FIELDS}, "quote"
            )
            got = set()
            for q in (data.get("quoteResponse") or {}).get("result") or []:
                sym = q.get("symbol", "").upper()
                if sym in self.symbols:
                    self.symbols[sym].quote = q
                    self.symbols[sym].quote_ts = now
                    got.add(sym)
            for sym in batch:  # unknown symbols: remember the miss so we don't retry every tick
                if sym not in got:
                    self.symbols[sym].quote_ts = now
            for cb in self.listeners:
                cb(got)
            return True

    # ---------- charts ----------
    def _chart_fresh(self, sym: str, rng: str, now: float) -> bool:
        s = self.symbols[sym]
        entry = s.charts.get(rng)
        if not entry:
            return False
        ts, _data, fetched_closed = entry
        open_ = self.is_open(sym)
        if not open_:
            # Market closed. One fetch after the close is enough; nothing changes
            # until the next session. Refresh at most daily as a safety net.
            return fetched_closed and now - ts < 24 * 3600
        max_age = RANGES[rng][2]
        if max_age is None:
            max_age = self.effective_interval(sym)
        if rng in ("3M", "1Y") and open_:
            # Daily bars: one fetch after the close is enough. While open we keep
            # whatever we have (the last bar gets patched from the quote).
            return True
        return now - ts < max_age

    async def get_chart(self, sym: str, rng: str) -> dict | None:
        sym = sym.upper()
        lock = self._chart_locks.setdefault((sym, rng), asyncio.Lock())
        async with lock:
            now = self._clock()
            if not self._chart_fresh(sym, rng, now):
                yr, yi, _ = RANGES[rng]
                try:
                    raw = await self.client.get(
                        f"/v8/finance/chart/{sym}",
                        {"range": yr, "interval": yi, "includePrePost": "false", "events": ""},
                        f"chart_{rng}", crumb=False,
                    )
                    self.symbols[sym].charts[rng] = (now, parse_chart(raw), not self.is_open(sym))
                except RateLimited:
                    pass
            entry = self.symbols[sym].charts.get(rng)
            if not entry:
                return None
            return patch_last_bar(entry[1], self.symbols[sym].quote, rng)

    # ---------- beta ----------
    async def get_beta(self, sym: str) -> float | None:
        s = self.symbols[sym]
        now = self._clock()
        if now - s.beta_ts >= BETA_MAX_AGE:
            s.beta_ts = now  # set first so failures also wait a day
            try:
                d = await self.client.get(
                    f"/v10/finance/quoteSummary/{sym}",
                    {"modules": "summaryDetail,defaultKeyStatistics"}, "beta",
                )
                r = ((d.get("quoteSummary") or {}).get("result") or [{}])[0]
                b = (r.get("summaryDetail") or {}).get("beta") or (r.get("defaultKeyStatistics") or {}).get("beta")
                s.beta = b.get("raw") if isinstance(b, dict) else b
                for cb in self.listeners:
                    cb({sym})
            except (RateLimited, aiohttp.ClientError, asyncio.TimeoutError, IndexError) as err:
                _LOGGER.debug("beta %s: %s", sym, err)
        return s.beta

    # ---------- what the card asks for ----------
    async def snapshot(self, symbol: str, rng: str = "1D", interval: int | None = None) -> dict:
        sym = symbol.upper().strip()
        if rng not in RANGES:
            rng = "1D"
        self.track(sym, interval)
        try:
            await self.refresh_quotes(force_symbols=[sym])
        except RateLimited:
            pass
        except (aiohttp.ClientError, asyncio.TimeoutError) as err:
            _LOGGER.warning("quote refresh failed: %s", err)
        s = self.symbols[sym]
        chart = None
        if s.quote:
            try:
                chart = await self.get_chart(sym, rng)
            except (aiohttp.ClientError, asyncio.TimeoutError) as err:
                _LOGGER.warning("chart %s %s failed: %s", sym, rng, err)
            await self.get_beta(sym)
        return {
            "symbol": sym,
            "range": rng,
            "quote": s.quote,
            "quote_age": round(self._clock() - s.quote_ts) if s.quote_ts else None,
            "beta": s.beta,
            "chart": chart,
            "interval": self.effective_interval(sym),
            "market_open": bool(s.quote and s.quote.get("marketState") == "REGULAR"),
            "rate_limited": self._clock() < self.client.backoff_until,
            "logo": f"https://financialmodelingprep.com/image-stock/{sym}.png",
        }

    async def lookup(self, symbol: str) -> dict | None:
        """Validate a symbol for the settings dialog. Cached for 10 minutes."""
        sym = symbol.upper().strip()
        if not sym or len(sym) > 15:
            return None
        if sym in self.symbols and self.symbols[sym].quote:
            return self.symbols[sym].quote
        hit = self.lookups.get(sym)
        if hit and self._clock() - hit[0] < MIN_CLOSED:
            return hit[1]
        d = await self.client.get("/v7/finance/quote", {"symbols": sym, "fields": QUOTE_FIELDS}, "lookup")
        res = ((d.get("quoteResponse") or {}).get("result") or [None])[0]
        self.lookups[sym] = (self._clock(), res)
        return res

    async def tick(self) -> None:
        """Called every 30 s by HA. Keeps sensors fresh without any card open."""
        try:
            await self.refresh_quotes()
        except (RateLimited, aiohttp.ClientError, asyncio.TimeoutError) as err:
            _LOGGER.debug("tick: %s", err)


def parse_chart(raw: dict) -> dict:
    res = ((raw.get("chart") or {}).get("result") or [None])[0]
    if not res:
        return {"t": [], "o": [], "h": [], "l": [], "c": [], "v": [], "gmtoffset": 0}
    q = ((res.get("indicators") or {}).get("quote") or [{}])[0]
    ts = res.get("timestamp") or []
    out = {"t": [], "o": [], "h": [], "l": [], "c": [], "v": []}
    for i, t in enumerate(ts):
        vals = [q.get(k, [None] * len(ts))[i] for k in ("open", "high", "low", "close")]
        if any(v is None for v in vals):
            continue
        out["t"].append(t)
        for k, v in zip(("o", "h", "l", "c"), vals):
            out[k].append(round(v, 4))
        out["v"].append((q.get("volume") or [0] * len(ts))[i] or 0)
    meta = res.get("meta") or {}
    out["gmtoffset"] = meta.get("gmtoffset", 0)
    out["tz"] = meta.get("exchangeTimezoneName")
    period = (meta.get("currentTradingPeriod") or {}).get("regular") or {}
    out["session"] = [period.get("start"), period.get("end")]
    return out


def patch_last_bar(chart: dict, quote: dict | None, rng: str) -> dict:
    """Move the last bar's close to the live quote price between chart fetches."""
    if not quote or not chart.get("c") or quote.get("marketState") != "REGULAR":
        return chart
    price = quote.get("regularMarketPrice")
    if price is None:
        return chart
    c = {k: (list(v) if isinstance(v, list) else v) for k, v in chart.items()}
    c["c"][-1] = price
    c["h"][-1] = max(c["h"][-1], price)
    c["l"][-1] = min(c["l"][-1], price)
    return c
