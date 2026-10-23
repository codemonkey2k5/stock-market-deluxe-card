/* Stock Market Deluxe - Card. Data comes from the stock_market_deluxe_card integration over the HA websocket. */
const VERSION = "1.0.2";
const DOMAIN = "stock_market_deluxe_card";
const DESIGN_W = 928;
const DESIGN_H = 824;
const ITEMS = { // key: label (all shown by default)
  position: "My position", tabs: "Range tabs", legend: "Vol / SMA / EMA line", volbars: "Volume bars", rsi: "RSI",
  open: "Open", high: "High", low: "Low", prev: "Prev Close", vol: "Volume", cap: "Market Cap",
  w52: "52W High / Low", pe: "PE", eps: "EPS", beta: "Beta", ah: "After Hours",
};
const normHide = (h) => (Array.isArray(h) ? h : typeof h === "string" ? h.split(",") : []).map((x) => String(x).trim()).filter((x) => x in ITEMS);
 // mockup aspect
const FONT_SCALE = (typeof window !== "undefined" && window.SMDC_FONT_SCALE) || 1.35;
const fsz = (html) => html.replace(/font-size:(\d+(?:\.\d+)?)px/g, (m, n) => `font-size:${(n * FONT_SCALE).toFixed(1)}px`).replace(/font-size="(\d+(?:\.\d+)?)"/g, (m, n) => `font-size="${(n * FONT_SCALE).toFixed(1)}"`);
const RANGES = ["1D", "5D", "1M", "3M", "1Y"];
const DEFAULT_CHOICES = [180, 300, 600, 900, 1800, 3600];

const CSS = `
:host{display:block}
.wrap{width:100%;position:relative;overflow:hidden}
.wrap.scaled .card{position:absolute;left:0;top:0;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
.card{width:928px;margin:0 auto;transform-origin:top left;background:#1c1f24;border:1px solid #2f343b;border-radius:16px;padding:22px 26px;box-shadow:0 10px 40px rgba(0,0,0,.5);
  font-family:Roboto,"Segoe UI",Arial,sans-serif;color:#e8eaed;position:relative;line-height:normal;font-size:16px;letter-spacing:normal;text-align:left;box-sizing:border-box}
.card *{white-space:nowrap}
.g{color:#3ec46d}.r{color:#e5484d}.m{color:#9aa0a6}
.hd{display:flex;justify-content:space-between;align-items:flex-start}
.id{display:flex;gap:14px;align-items:center;min-width:0}
.logo{width:40px;height:44px;display:flex;align-items:center;justify-content:center;flex:none}
.logo img{max-width:40px;max-height:44px;object-fit:contain}
.logo .ph{width:40px;height:40px;border-radius:50%;background:#2a3140;color:#8fa3bf;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px}
.tk{font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px}
.dot{width:10px;height:10px;border-radius:50%;background:#3ec46d;box-shadow:0 0 6px #3ec46d}
.mk{font-size:12px;font-weight:500;color:#3ec46d;letter-spacing:.3px}
.mk.closed{color:#9aa0a6}
.nm{font-size:15px;color:#9aa0a6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btns{display:flex;gap:12px;align-items:center}
.ib{width:44px;height:44px;border-radius:50%;border:1px solid #6b7480;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#353c47}
.ib:hover{background:#434b57}
.dots{font-size:22px;letter-spacing:2px;color:#e8eaed;padding:0 10px;height:44px;border-radius:22px;cursor:pointer;background:#353c47;border:1px solid #6b7480}
.row2{display:flex;justify-content:space-between;align-items:flex-end;margin-top:6px;gap:12px}
.px{font-size:56px;font-weight:600;letter-spacing:-1px;line-height:1.05}
.ch{font-size:20px;font-weight:500;margin-top:4px}
.pos{display:flex;min-width:0!important;background:linear-gradient(135deg,#283a55,#233149);border:1px solid #4a6a96;border-radius:12px;padding:12px 4px;min-width:470px}
.pc{flex:none;padding:0 14px;border-left:1px solid #4a6a96}.pc:first-child{border:none;display:flex;gap:10px;align-items:center}
.pl{font-size:12px;color:#8fa3bf;text-transform:uppercase;letter-spacing:.6px}.pv{font-size:20px;font-weight:600;margin-top:3px;white-space:nowrap}
.tabs{display:flex;gap:8px;margin-top:10px}
.tab{padding:5px 16px;border-radius:7px;background:#363c46;border:1px solid #59616d;color:#e3e6ea;font-size:14px;cursor:pointer;font-family:inherit}
.tab.on{background:#58616f;border-color:#8a94a3;color:#fff;font-weight:600}
.lg{display:flex;gap:18px;font-size:13px;color:#c4c7cc;margin:8px 0 4px}.lg b{font-weight:500}
.lg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
svg.ch1{display:block;overflow:visible}
.grid{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #2f343b;margin-top:12px}
.st{display:flex;gap:10px;align-items:center;padding:8px 10px;min-width:0;border-bottom:1px solid #2a2e35;border-right:1px solid #2a2e35}
.st.re{border-right:none}.st.lr{border-bottom:none}
.chk{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 10px;margin:4px 0 6px}.chk label{display:flex;gap:6px;align-items:center;font-size:13px;color:#c4c7cc;cursor:pointer}.chk input{width:16px;height:16px;margin:0;accent-color:#03a9f4}.chkh{font-size:12px;color:#9aa0a6;margin-top:10px}
.sl{font-size:13px;color:#9aa0a6}.sv{font-size:17px;font-weight:500;white-space:nowrap}.sv small{font-size:12px;color:#9aa0a6}
.rsi{margin-top:8px;border:1px solid #2f343b;border-radius:8px;padding:6px 0 4px 0}
.msg{padding:40px;text-align:center;color:#9aa0a6}
.stale{font-size:11px;color:#7d838a;text-align:right;margin-top:6px}
/* settings dialog */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;justify-content:center;z-index:9;padding-top:60px}
.dlg{line-height:normal;width:640px;max-width:calc(100vw - 24px);background:#1c1f24;border:1px solid #2f343b;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.7);padding:24px 28px;font-family:Roboto,"Segoe UI",Arial,sans-serif;color:#e8eaed}
.dlg h2{font-size:22px;font-weight:500;display:flex;justify-content:space-between;align-items:center}
.dlg .x{color:#9aa0a6;font-size:22px;cursor:pointer;background:none;border:none}
.f{margin-top:22px;position:relative;background:#2a2e35;border:1px solid #444a53;border-radius:6px 6px 0 0;border-bottom:2px solid #5f6670;padding:22px 14px 8px}
.f:focus-within{border-bottom-color:#03a9f4}
.f label{position:absolute;top:6px;left:14px;font-size:12px;color:#9aa0a6}
.f:focus-within label{color:#03a9f4}
.f input,.f select{font-size:17px;background:none;border:none;outline:none;color:#e8eaed;width:100%;font-family:inherit;caret-color:#03a9f4}
.f select option{background:#2a2e35}
.help{font-size:12px;color:#9aa0a6;margin:6px 4px 0}
.prev{display:flex;gap:12px;align-items:center;margin-top:10px;background:#23272d;border-radius:10px;padding:10px 12px;min-height:52px}
.prev img{width:26px;height:28px;object-fit:contain}
.act{display:flex;justify-content:flex-end;gap:10px;margin-top:28px}
.b{padding:9px 20px;border-radius:20px;font-size:14px;font-weight:500;letter-spacing:.4px;border:none;cursor:pointer;font-family:inherit;background:none;color:#03a9f4}
.b.p{background:#03a9f4;color:#0b1a22}.b:disabled{opacity:.5;cursor:default}
`;

const DEMO = {"symbol":"TSLA","range":"1D","quote":{"symbol":"TSLA","shortName":"Tesla, Inc.","longName":"Tesla, Inc.","currency":"USD","exchange":"NMS","fullExchangeName":"NasdaqGS","marketState":"PREPRE","regularMarketPrice":375.23,"regularMarketChange":-2.8,"regularMarketChangePercent":-0.7407,"regularMarketOpen":372.172,"regularMarketDayHigh":377.05,"regularMarketDayLow":371.3,"regularMarketPreviousClose":378.03,"regularMarketVolume":18314332,"averageDailyVolume3Month":37640115,"marketCap":1481988767744,"fiftyTwoWeekHigh":498.83,"fiftyTwoWeekLow":297.38,"trailingPE":347.4352,"epsTrailingTwelveMonths":1.08,"postMarketPrice":374.88,"postMarketChange":-0.35,"postMarketChangePercent":-0.0933,"regularMarketTime":1791921600,"gmtOffSetMilliseconds":-14400000,"exchangeTimezoneName":"America/New_York"},"quote_age":0,"beta":1.916,"chart":{"t":[1791898200,1791898500,1791898800,1791899100,1791899400,1791899700,1791900000,1791900300,1791900600,1791900900,1791901200,1791901500,1791901800,1791902100,1791902400,1791902700,1791903000,1791903300,1791903600,1791903900,1791904200,1791904500,1791904800,1791905100,1791905400,1791905700,1791906000,1791906300,1791906600,1791906900,1791907200,1791907500,1791907800,1791908100,1791908400,1791908700,1791909000,1791909300,1791909600,1791909900,1791910200,1791910500,1791910800,1791911100,1791911400,1791911700,1791912000,1791912300,1791912600,1791912900,1791913200,1791913500,1791913800,1791914100,1791914400,1791914700,1791915000,1791915300,1791915600,1791915900,1791916200,1791916500,1791916800,1791917100,1791917400,1791917700,1791918000,1791918300,1791918600,1791918900,1791919200,1791919500,1791919800,1791920100,1791920400,1791920700,1791921000,1791921300,1791921600],"o":[372.17,372.3,373.55,374.51,374.75,374.46,373.86,373.74,373.92,373.83,374.24,374.53,374.47,374.18,374.65,375.49,375.57,375.44,375.29,376.11,376.03,376.14,376.36,376.72,376.76,376.85,376.4,376.3,376.33,376.61,375.96,376.09,376.07,375.66,375.85,376.24,376.06,376.21,375.89,376.32,376.36,376.26,375.71,374.68,375.0,374.85,374.9,375.21,375.14,375.19,375.19,374.93,375.0,374.49,374.9,374.78,375.14,374.41,373.81,373.75,373.7,373.69,373.69,373.61,373.83,374.14,373.81,373.6,373.74,374.13,374.44,374.26,374.66,375.1,375.57,375.69,375.66,376.87,375.23],"h":[373.65,374.0,374.9,375.4,374.82,374.46,374.1,374.3,374.55,374.66,374.7,374.64,374.63,374.94,375.56,375.75,375.69,375.74,376.22,376.14,376.31,376.63,376.84,376.82,376.98,376.98,376.74,376.37,376.72,376.63,376.36,376.13,376.3,375.95,376.34,376.29,376.39,376.34,376.34,376.45,376.44,376.27,375.77,375.05,375.15,375.03,375.35,375.46,375.34,375.53,375.22,375.15,375.05,375.01,375.11,375.38,375.25,374.47,374.02,373.9,373.95,373.8,373.88,373.93,374.16,374.37,374.02,373.87,374.09,374.65,374.63,374.83,375.1,375.57,375.83,375.82,377.05,376.91,375.23],"l":[371.3,371.67,373.2,374.4,373.26,373.45,373.08,373.42,373.65,373.83,373.95,374.1,374.09,374.01,374.57,375.26,375.02,375.08,375.18,375.6,375.7,375.77,376.3,376.4,376.52,376.12,376.07,375.9,376.3,375.85,375.81,375.86,375.63,375.66,375.78,375.92,376.01,375.81,375.83,376.19,376.27,375.71,374.66,374.5,374.75,374.76,374.85,375.01,375.04,375.08,374.86,374.85,374.42,374.4,374.56,374.7,374.41,373.74,373.67,373.51,373.61,373.52,373.57,373.56,372.72,373.81,373.51,373.57,373.66,373.92,374.13,374.15,374.63,374.93,375.3,375.38,375.54,375.07,375.23],"c":[372.36,373.51,374.53,374.81,374.4,373.83,373.77,373.89,373.8,374.24,374.55,374.39,374.1,374.68,375.52,375.57,375.44,375.25,376.07,375.95,376.14,376.3,376.79,376.77,376.84,376.43,376.24,376.33,376.57,375.96,376.13,376.09,375.71,375.84,376.2,376.03,376.19,375.95,376.27,376.32,376.32,375.71,374.74,375.0,374.85,374.89,375.22,375.14,375.21,375.19,374.94,374.98,374.49,374.87,374.8,375.18,374.45,373.86,373.8,373.7,373.66,373.71,373.64,373.8,374.07,373.85,373.62,373.73,374.09,374.44,374.26,374.66,375.08,375.57,375.72,375.64,376.89,375.24,375.23],"v":[1498893,632808,550747,425459,385957,279040,312706,233247,257998,237701,177442,126959,162347,252345,287015,235601,0,6430757,226289,151228,150340,170996,241509,193195,258795,212674,151043,132195,120039,116128,118700,78111,133105,88401,95633,69126,82283,98867,83440,70749,51830,90818,216799,165273,114458,80472,114728,103544,60688,84267,104910,64476,98382,93055,92926,127821,127403,173176,124381,119073,105242,104058,93910,102544,433187,179582,175793,122531,144460,234998,133815,157541,167044,170766,250309,190553,488272,751164,0],"gmtoffset":-14400,"tz":"America/New_York","session":[1791984600,1792008000]},"interval":300,"market_open":false,"rate_limited":false,"logo":"https://financialmodelingprep.com/image-stock/TSLA.png"}; // card picker preview only (TSLA, Oct 13 2026 close)
const REG = new Map(); // card_id -> connected cards using it
const CSS_F = fsz(CSS);
const ic = (p, c) => `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I = {
  open: ic('<path d="M3 18h18M6 14a6 6 0 0 1 12 0M12 4v3M4.5 8l2 2M19.5 8l-2 2"/>', "#f5a524"),
  high: ic('<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>', "#e5484d"),
  low: ic('<path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/>', "#4c8dff"),
  prev: ic('<path d="M20 12a8 8 0 0 1-14 5M4 12a8 8 0 0 1 14-5M18 3v4h-4M6 21v-4h4"/>', "#c4c7cc"),
  vol: ic('<path d="M5 20v-6M10 20V9M15 20v-8M20 20V4"/>', "#2bc4c4"),
  cap: '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9h-9z" fill="#a46bff"/><path d="M14 1.5a9 9 0 0 1 8.5 8.5H14z" fill="#c9a6ff"/></svg>',
  w52: ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', "#3ec46d"),
  pe: '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#f5c518"/></svg>',
  eps: ic('<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.6-.6-3-1.6M12 6v12"/>', "#4c8dff"),
  beta: '<svg width="30" height="30" viewBox="0 0 24 24"><text x="5" y="19" style="font-size: 20px" fill="#f08a3c" font-family="serif">β</text></svg>',
  ah: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', "#3ec46d"),
  pos: ic('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>', "#4c8dff"),
};
const SLIDERS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8eaed" stroke-width="1.8" stroke-linecap="round"><path d="M6 3v18M12 3v18M18 3v18"/><rect x="4" y="7" width="4" height="3" fill="#1c1f24"/><rect x="10" y="14" width="4" height="3" fill="#1c1f24"/><rect x="16" y="5" width="4" height="3" fill="#1c1f24"/></svg>';

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (v) => typeof v === "number" && isFinite(v);
const SYM = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "$", AUD: "$", INR: "₹", CHF: "CHF " };
function money(v, cur = "USD", dp = 2) {
  if (!num(v)) return "—";
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return (v < 0 ? "-" : "") + (SYM[cur] ?? "") + s;
}
const signed = (v, cur, dp = 2) => (num(v) ? (v >= 0 ? "+" : "-") + money(Math.abs(v), cur, dp) : "—");
const pct = (v) => (num(v) ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` : "");
function big(v) {
  if (!num(v)) return "—";
  const a = Math.abs(v);
  for (const [d, s] of [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]]) {
    if (a >= d) { const x = v / d; return (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.0+$/, "") + s; }
  }
  return String(Math.round(v));
}
const short = (v, cur) => (num(v) ? money(v, cur, v >= 100 ? 0 : 2) : "—");
const fmtInterval = (s) => (s >= 3600 ? `${s / 3600} hour${s > 3600 ? "s" : ""}` : `${s / 60} minutes`);

function sma(a, n) { return a.map((_, i) => { const s = a.slice(Math.max(0, i - n + 1), i + 1); return s.reduce((x, y) => x + y, 0) / s.length; }); }
function ema(a, n) { const k = 2 / (n + 1); const o = []; a.forEach((x, i) => o.push(i ? x * k + o[i - 1] * (1 - k) : x)); return o; }
function rsi(a, n = 14) {
  const out = []; let ag = 0, al = 0;
  for (let i = 1; i < a.length; i++) {
    const d = a[i] - a[i - 1], g = Math.max(d, 0), l = Math.max(-d, 0);
    if (i <= n) { ag += g / n; al += l / n; } else { ag = (ag * (n - 1) + g) / n; al = (al * (n - 1) + l) / n; }
    out.push(i < n ? null : al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  }
  return out;
}
function niceStep(range, target = 7) {
  const raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * p) return m * p;
  return 10 * p;
}

function exDate(t, off) { return new Date((t + off) * 1000); } // read with getUTC*
function hm(d, withAmPm) {
  let h = d.getUTCHours(); const m = d.getUTCMinutes(); const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12; return `${h}:${String(m).padStart(2, "0")}${withAmPm ? " " + ap : ""}`;
}
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Builds the three chart SVG bodies. W is the plot width; labels go to the right of it. */
function buildChart(ch, range, quote, H = 190) {
  const LBL = Math.round(68 * FONT_SCALE), W = 868 - LBL, VH = 50, RH = 60, F = FONT_SCALE;
  const n = ch.c.length;
  let slots = n;
  if (range === "1D" && ch.session?.[0] && ch.session?.[1] && n > 1) {
    const step = 300; // 5m bars
    slots = Math.max(n, Math.round((ch.session[1] - ch.session[0]) / step));
  }
  const bw = (W - 16) / slots;
  const x = (i) => 8 + i * bw + bw / 2;
  let lo = Math.min(...ch.l), hi = Math.max(...ch.h);
  const pad = (hi - lo) * 0.08 || hi * 0.01 || 1; lo -= pad; hi += pad;
  const y = (p) => H - ((p - lo) / (hi - lo)) * H;
  const cw = Math.max(1, bw * 0.6);
  const last = ch.c[n - 1];
  const out = [];
  const step = niceStep(hi - lo, Math.max(3, Math.min(7, Math.floor(H / (26 * F)))));
  for (let p = Math.ceil(lo / step) * step; p <= hi; p += step) {
    const yy = y(p);
    out.push(`<line x1="0" x2="${W}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}" stroke="#2a2f36"/>`);
    if (Math.abs(yy - y(last)) > 16 * F && yy > 7 * F && yy < H - 8 * F) {
      const dp = step < 1 ? (step < 0.1 ? 2 : 1) : 0;
      out.push(`<text x="${W + 8}" y="${(yy + 4 * F).toFixed(1)}" fill="#9aa0a6" font-size="12">${p.toFixed(dp)}</text>`);
    }
  }
  for (let i = 0; i < n; i++) {
    const o = ch.o[i], h = ch.h[i], l = ch.l[i], c = ch.c[i];
    const col = c >= o ? "#3ec46d" : "#e5484d";
    out.push(`<line x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${y(h).toFixed(1)}" y2="${y(l).toFixed(1)}" stroke="${col}" stroke-width="1"/>`);
    out.push(`<rect x="${(x(i) - cw / 2).toFixed(1)}" y="${y(Math.max(o, c)).toFixed(1)}" width="${cw.toFixed(1)}" height="${Math.max(1, Math.abs(y(o) - y(c))).toFixed(1)}" fill="${col}"/>`);
  }
  const s20 = sma(ch.c, 20), e9 = ema(ch.c, 9);
  const pl = (a, col) => `<polyline fill="none" stroke="${col}" stroke-width="1.6" points="${a.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}"/>`;
  out.push(pl(s20, "#4c8dff"), pl(e9, "#f5a524"));
  const up = !quote || (quote.regularMarketChange ?? 0) >= 0;
  const lc = up ? "#3ec46d" : "#e5484d", lb = up ? "#2e9e57" : "#c13a3f";
  const yc = y(last);
  out.push(`<line x1="0" x2="${W}" y1="${yc.toFixed(1)}" y2="${yc.toFixed(1)}" stroke="${lc}" stroke-dasharray="3 3"/>`);
  const lbl = last.toFixed(2), lw = Math.min(LBL - 2, Math.max(54, lbl.length * 7.2 + 10) * F);
  out.push(`<rect x="${W + 2}" y="${(yc - 10 * F).toFixed(1)}" width="${lw}" height="${(20 * F).toFixed(1)}" rx="4" fill="${lb}"/><text x="${W + 2 + lw / 2}" y="${(yc + 4.5 * F).toFixed(1)}" fill="#fff" font-size="12" font-weight="600" text-anchor="middle">${lbl}</text>`);

  // Scale volume to the 95th percentile so the opening auction bar doesn't flatten the rest.
  const sv = [...ch.v].sort((a, b) => a - b);
  const vm = Math.max(Math.min(Math.max(...ch.v), (sv[Math.floor(sv.length * 0.95)] || 0) * 1.3), 1);
  let vol = ch.v.map((v, i) => `<rect x="${(x(i) - cw / 2).toFixed(1)}" y="${(VH - Math.min(v / vm, 1) * VH).toFixed(1)}" width="${cw.toFixed(1)}" height="${(Math.min(v / vm, 1) * VH).toFixed(1)}" fill="${ch.c[i] >= ch.o[i] ? "#3ec46d" : "#e5484d"}" opacity=".45"/>`).join("");
  vol += `<text x="${W + 8}" y="${(10 * F).toFixed(1)}" fill="#9aa0a6" font-size="11">${big(vm)}</text><text x="${W + 8}" y="${VH}" fill="#9aa0a6" font-size="11">0</text>`;

  // time axis
  const off = ch.gmtoffset || 0, ticks = [];
  if (range === "1D") {
    const base = ch.session?.[0] || ch.t[0];
    for (let k = 0; k < slots; k += 12) {
      const d = exDate(base + k * 300, off);
      ticks.push([k, hm(d, k === 0 || d.getUTCHours() === 12)]);
    }
  } else {
    let prev = null;
    ch.t.forEach((t, i) => {
      const d = exDate(t, off);
      const key = range === "5D" ? d.getUTCDate() : range === "1M" ? `${d.getUTCMonth()}-${Math.floor((d.getUTCDate() - 1) / 7)}` : d.getUTCMonth();
      if (key !== prev) {
        prev = key;
        const label = range === "5D" ? `${DOW[d.getUTCDay()]} ${d.getUTCDate()}` : range === "1M" ? `${MON[d.getUTCMonth()]} ${d.getUTCDate()}` : MON[d.getUTCMonth()] + (d.getUTCMonth() === 0 ? ` ${d.getUTCFullYear()}` : "");
        ticks.push([i, label]);
      }
    });
    if (range === "1Y") for (let j = ticks.length - 1; j > 0; j--) if (ticks[j][0] - ticks[j - 1][0] < slots / 14) ticks.splice(j, 1);
  }
  { // keep labels at least ~62px*scale apart so the larger font never collides
    const kept = [];
    for (const tk of ticks) if (!kept.length || x(tk[0]) - x(kept[kept.length - 1][0]) >= 62 * F) kept.push(tk);
    ticks.length = 0; ticks.push(...kept);
  }
  const times = ticks.map(([i, t], j) => `<text x="${j === 0 && i === 0 ? 8 : x(i).toFixed(1)}" y="${(14 * F).toFixed(1)}" fill="#9aa0a6" font-size="12" text-anchor="${j === 0 && i === 0 ? "start" : "middle"}">${t}</text>`).join("");

  const r = rsi(ch.c);
  const ry = (v) => RH - ((v - 10) / 90) * RH;
  const rx = (i) => x(i + 1);
  let rs = [70, 30].map((v) => `<line x1="0" x2="${W}" y1="${ry(v).toFixed(1)}" y2="${ry(v).toFixed(1)}" stroke="#3a3f47" stroke-dasharray="3 3"/><text x="${W + 8}" y="${(ry(v) + 4 * F).toFixed(1)}" fill="#9aa0a6" font-size="11">${v}</text>`).join("") + `<line x1="0" x2="${W}" y1="${ry(50).toFixed(1)}" y2="${ry(50).toFixed(1)}" stroke="#3a3f47" stroke-dasharray="3 3"/>`;
  const rp = r.map((v, i) => (v == null ? null : `${rx(i).toFixed(1)},${ry(Math.max(10, Math.min(100, v))).toFixed(1)}`)).filter(Boolean);
  rs += `<polyline fill="none" stroke="#b07cff" stroke-width="1.6" points="${rp.join(" ")}"/>`;
  return { chart: out.join(""), vol, times, rsi: rs, sma: s20[n - 1], ema: e9[n - 1], r: r.filter((v) => v != null).pop() };
}

function logoHtml(sym, url, size = 40) {
  return `<img src="${esc(url)}" alt="" referrerpolicy="no-referrer" style="max-width:${size}px;max-height:${size + 4}px" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:'${esc(sym).slice(0, 4)}'}))">`;
}

class StockMarketCard extends HTMLElement {
  static getStubConfig() {
    return { card_id: newId(), symbol: "AAPL", shares: 0, interval: 300 };
  }
  static getConfigElement() { return document.createElement("stock-market-deluxe-card-editor"); }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._range = "1D";
    this._data = null;
    this._error = null;
    this._stored = undefined;
    this._limits = { min_open: 180, min_closed: 600, choices: DEFAULT_CHOICES };
  }

  setConfig(config) {
    if (this._config) REG.get(this._cardId)?.delete(this);
    this._config = { shares: 0, interval: 300, ...config };
    if (this.isConnected) { if (!REG.has(this._cardId)) REG.set(this._cardId, new Set()); REG.get(this._cardId).add(this); }
    this._stored = undefined;
    if (this._hass) this._init();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first && this._config) this._init();
  }

  getCardSize() { return 17; }
  getGridOptions() { return { columns: 15, rows: "auto", min_columns: 6 }; }

  // Cards copied with "Duplicate" share a card_id. Give each copy its own
  // storage key (id, id~2, id~3 ...) by its place on the page, so they never
  // overwrite each other's settings.
  get _storeId() {
    const id = this._cardId, peers = [...(REG.get(id) || [])].filter((e) => e.isConnected && !e._inDialog());
    if (peers.length <= 1 || !peers.includes(this)) return id;
    const pos = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.top + window.scrollY), Math.round(r.left)]; };
    peers.sort((a, b) => { const A = pos(a), B = pos(b); return A[0] - B[0] || A[1] - B[1]; });
    const i = peers.indexOf(this);
    return i === 0 ? id : `${id}~${i + 1}`;
  }
  get _cardId() {
    return this._config.card_id || `sym_${(this._config.symbol || "").toLowerCase()}`;
  }
  get _settings() {
    const s = this._stored || {};
    return {
      symbol: (s.symbol || this._config.symbol || "AAPL").toUpperCase(),
      shares: Number(s.shares ?? this._config.shares ?? 0),
      interval: Number(s.interval ?? this._config.interval ?? 300),
      stmtValue: num(s.statement_value) ? s.statement_value : null,
      stmtDate: s.statement_date || null,
    };
  }
  get _hide() {
    const s = this._stored || {};
    if (Array.isArray(s.hide)) return new Set(normHide(s.hide));
    return new Set(normHide(this._config.hide));
  }

  _inDialog() {
    for (let n = this; n; n = n.parentNode || n.host) if (/^hui-dialog|^ha-dialog|^hui-card-picker/.test(n.localName || "")) return true;
    return false;
  }
  _inPicker() {
    for (let n = this; n; n = n.parentNode || n.host) if (n.localName === "hui-card-picker") return true;
    return false;
  }

  async _init() {
    if (this._initing) return;
    this._initing = true;
    // In the dashboard card picker, show a demo instead of calling the integration.
    for (let i = 0; i < 5 && !this.isConnected; i++) await new Promise((r) => requestAnimationFrame(r));
    if (this._demo || this._inPicker()) {
      this._demo = true;
      this._stored = { symbol: "TSLA", shares: 50, interval: 300 };
      this._data = DEMO;
      this._initing = false;
      this._render();
      return;
    }
    try {
      this._limits = await this._hass.callWS({ type: `${DOMAIN}/limits` });
      for (let i = 0; i < 2; i++) await new Promise((r) => requestAnimationFrame(r)); // let the page lay out
      this._sid = this._storeId;
      this._stored = await this._hass.callWS({ type: `${DOMAIN}/settings/get`, card_id: this._sid });
    } catch (e) {
      this._error = "The Stock Market Deluxe - Card integration is not set up. Add it under Settings → Devices & services.";
      this._render();
    }
    this._initing = false;
    this._fetch();
  }

  connectedCallback() {
    if (this._config) { if (!REG.has(this._cardId)) REG.set(this._cardId, new Set()); REG.get(this._cardId).add(this); }
    this._vis = () => { if (!document.hidden) this._fetch(); };
    document.addEventListener("visibilitychange", this._vis);
    if (this._hass && this._config && this._data) this._fetch();
  }
  disconnectedCallback() {
    if (this._config) REG.get(this._cardId)?.delete(this);
    clearTimeout(this._timer);
    document.removeEventListener("visibilitychange", this._vis);
  }

  async _fetch() {
    clearTimeout(this._timer);
    if (!this._hass || !this._config || !this.isConnected && this._data) return;
    if (this._demo) { this._render(); return; }
    const s = this._settings;
    try {
      const d = await this._hass.callWS({ type: `${DOMAIN}/data`, symbol: s.symbol, range: this._range, interval: s.interval });
      this._data = d;
      this._error = d.quote ? null : `No quote found for ${s.symbol}.`;
      await this._fetchRef(s);
    } catch (e) {
      if (!this._data) this._error = e.message || String(e);
    }
    this._render();
    // The integration decides when Yahoo is actually called. Asking it more
    // often than the effective interval only returns cached data.
    const wait = Math.max(this._data?.interval ?? this._limits.min_open, this._limits.min_open) * 1000;
    if (!document.hidden) this._timer = setTimeout(() => this._fetch(), wait + 2000);
  }

  // Close on the statement date (or the last trading day before it), from the 1Y daily chart.
  async _fetchRef(s) {
    if (s.stmtValue == null || !s.stmtDate) { this._ref = null; return; }
    const key = `${s.symbol}|${s.stmtDate}`;
    if (this._ref?.key === key && num(this._ref.close)) return;
    try {
      const d = await this._hass.callWS({ type: `${DOMAIN}/data`, symbol: s.symbol, range: "1Y", interval: s.interval });
      const c = d.chart || {}, fmt = new Intl.DateTimeFormat("en-CA", { timeZone: c.tz || "America/New_York" });
      let close = null;
      if (c.t?.length && fmt.format(new Date(c.t[0] * 1000)) <= s.stmtDate) {
        for (let i = 0; i < c.t.length; i++) {
          if (fmt.format(new Date(c.t[i] * 1000)) > s.stmtDate) break;
          close = c.c[i];
        }
      }
      this._ref = { key, close: num(close) ? close : null };
    } catch (e) {
      this._ref = { key, close: null };
    }
  }

  _render() {
    const root = this.shadowRoot;
    if (!this._data || this._error && !this._data?.quote) {
      root.innerHTML = `<style>${CSS_F}</style><div class="wrap"><div class="card"><div class="msg">${esc(this._error || "Loading…")}</div></div></div>`;
      this._fit();
      return;
    }
    const d = this._data, q = d.quote, cur = q.currency || "USD";
    const s = this._settings;
    const open = q.marketState === "REGULAR";
    const stateText = open ? "Market open" : { PRE: "Pre-market", PREPRE: "Market closed", POST: "After hours", POSTPOST: "Market closed", CLOSED: "Market closed" }[q.marketState] || "Market closed";
    const chg = q.regularMarketChange, chp = q.regularMarketChangePercent;
    const up = (chg ?? 0) >= 0;
    let value = s.shares * q.regularMarketPrice;
    // Start from the statement value and move with the price since that day.
    const ref = this._ref?.key === `${s.symbol}|${s.stmtDate}` ? this._ref.close : null;
    if (s.stmtValue != null && s.stmtDate && num(ref) && ref > 0 && num(q.regularMarketPrice)) {
      value = s.shares > 0 ? s.stmtValue + s.shares * (q.regularMarketPrice - ref) : s.stmtValue * q.regularMarketPrice / ref;
    }
    const today = num(chg) ? s.shares * chg : null;
    const name = q.longName || q.shortName || q.symbol;
    const exch = q.fullExchangeName || q.exchange || "";
    const exchShort = /^Nasdaq/i.test(exch) ? "NASDAQ" : /^NYSE/i.test(exch) ? "NYSE" : exch;
    const shareTxt = `${s.shares.toLocaleString("en-US", { maximumFractionDigits: 4 })} share${s.shares === 1 ? "" : "s"}`;

    let ext = { label: "After Hours", p: q.postMarketPrice, c: q.postMarketChange, cp: q.postMarketChangePercent };
    if ((q.marketState === "PRE" || q.marketState === "PREPRE") && num(q.preMarketPrice)) ext = { label: "Pre-Market", p: q.preMarketPrice, c: q.preMarketChange, cp: q.preMarketChangePercent };
    const extHtml = num(ext.p) ? `${money(ext.p, cur)} <span class="${(ext.c ?? 0) >= 0 ? "g" : "r"}" style="font-size:14px">${signed(ext.c, cur)} (${pct(ext.cp)})</span>` : "—";

    const ch = d.chart && d.chart.c && d.chart.c.length > 1 ? buildChart(d.chart, this._range, q, this._chartH || 190) : null;
    const H = this._hide, on = (k) => !H.has(k);
    const age = d.quote_age != null ? Math.round(d.quote_age / 60) : null;

    const cells = [
      ["open", "Open", money(q.regularMarketOpen, cur)], ["high", "High", money(q.regularMarketDayHigh, cur)], ["low", "Low", money(q.regularMarketDayLow, cur)], ["prev", "Prev Close", money(q.regularMarketPreviousClose, cur)],
      ["vol", "Volume", `${big(q.regularMarketVolume)} <small>vs avg ${big(q.averageDailyVolume3Month)}</small>`], ["cap", "Market Cap", num(q.marketCap) ? (SYM[cur] ?? "") + big(q.marketCap) : "—"],
      ["w52", "52W High / Low", `${short(q.fiftyTwoWeekHigh, cur)} / ${short(q.fiftyTwoWeekLow, cur)}`], ["pe", "PE", num(q.trailingPE) ? q.trailingPE.toFixed(1) : "—"],
      ["eps", "EPS", money(q.epsTrailingTwelveMonths, cur)], ["beta", "Beta", num(d.beta) ? d.beta.toFixed(2) : "—"], ["ah", ext.label, extHtml, 2],
    ].filter((c) => on(c[0]));
    // pack into 4 columns; the last cell of a row stretches to fill it, so hidden items leave no gaps
    const rows = []; let row = [], used = 0;
    for (const c of cells) {
      const span = c[3] || 1;
      if (used + span > 4) { rows.push(row); row = []; used = 0; }
      row.push([...c.slice(0, 3), span]); used += span;
    }
    if (row.length) rows.push(row);
    const stats = rows.length ? `<div class="grid">${rows.map((r, ri) => {
      const tot = r.reduce((n, c) => n + c[3], 0);
      return r.map((c, ci) => {
        const span = ci === r.length - 1 ? c[3] + 4 - tot : c[3];
        return `<div class="st${ci === r.length - 1 ? " re" : ""}${ri === rows.length - 1 ? " lr" : ""}" style="grid-column:span ${span}">${I[c[0]]}<div><div class="sl">${c[1]}</div><div class="sv">${c[2]}</div></div></div>`;
      }).join("");
    }).join("")}</div>` : "";
    root.innerHTML = fsz(`<style>${CSS}</style><div class="wrap"><div class="card">
<div class="hd"><div class="id"><div class="logo">${logoHtml(q.symbol, d.logo)}</div><div style="min-width:0"><div class="tk">${esc(q.symbol)} ${open ? '<span class="dot"></span>' : ""}<span class="mk ${open ? "" : "closed"}">${stateText}</span></div><div class="nm">${esc(name)}${exchShort ? " · " + esc(exchShort) : ""}</div></div></div>
<div class="btns"><button class="ib" id="set" title="Settings">${SLIDERS}</button><button class="dots" id="more" title="More info">•••</button></div></div>
<div class="row2"><div><div class="px">${money(q.regularMarketPrice, cur)}</div><div class="ch ${up ? "g" : "r"}">${up ? "▲" : "▼"} ${signed(chg, cur)} (${pct(chp)})</div></div>
${on("position") ? `<div class="pos"><div class="pc">${I.pos}<div><div class="pl">My position</div><div class="pv">${shareTxt}</div></div></div>
<div class="pc"><div class="pl">Value</div><div class="pv">${money(value, cur)}</div></div>
<div class="pc"><div class="pl">Today</div><div class="pv ${(today ?? 0) >= 0 ? "g" : "r"}">${signed(today, cur)} <span style="font-size:15px">(${pct(chp)})</span></div></div></div>` : ""}</div>
${on("tabs") ? `<div class="tabs">${RANGES.map((r) => `<button class="tab ${r === this._range ? "on" : ""}" data-r="${r}">${r}</button>`).join("")}</div>` : ""}
${ch ? `${on("legend") ? `<div class="lg"><span><i style="background:#2bc4c4"></i>Vol <b style="color:#2bc4c4">${big(q.regularMarketVolume)}</b></span><span><i style="background:#4c8dff"></i>SMA (20) <b>${ch.sma.toFixed(2)}</b></span><span><i style="background:#f5a524"></i>EMA (9) <b>${ch.ema.toFixed(2)}</b></span></div>` : `<div style="height:${on("tabs") ? 8 : 0}px"></div>`}
<svg class="ch1" viewBox="0 0 868 ${this._chartH || 190}" width="868" height="${this._chartH || 190}">${ch.chart}</svg>
${on("volbars") ? `<svg class="ch1" viewBox="0 0 868 52" width="868" height="52" style="margin-top:4px">${ch.vol}</svg>` : ""}
<svg class="ch1" viewBox="0 0 868 ${Math.round(18 * FONT_SCALE)}" width="868" height="${Math.round(18 * FONT_SCALE)}">${ch.times}</svg>
${on("rsi") ? `<div class="rsi"><div style="font-size:13px;color:#c4c7cc;padding:0 10px 2px">RSI (14) <b style="color:#b07cff;font-weight:500">${num(ch.r) ? ch.r.toFixed(2) : "—"}</b></div><svg class="ch1" viewBox="0 0 868 62" width="868" height="62">${ch.rsi}</svg></div>` : ""}`
      : `<div class="msg">${d.rate_limited ? "Yahoo is rate limiting requests. The chart will load on the next refresh." : "Chart data not available yet."}</div>`}
${stats}
${d.rate_limited || (age != null && age > 30) ? `<div class="stale">${d.rate_limited ? "Yahoo rate limit, showing cached data. " : ""}${age != null ? `Updated ${age} min ago` : ""}</div>` : ""}
</div></div>`);
    root.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => { this._range = b.dataset.r; this._fetch(); }));
    root.getElementById("set").addEventListener("click", () => this._openSettings());
    root.getElementById("more").addEventListener("click", () => {
      const ent = `sensor.stock_${q.symbol.toLowerCase().replace(/[-.]/g, "_").replace(/\^/g, "")}`;
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: ent } }));
    });
    if (this._dlg) root.appendChild(this._dlg);
    this._fit();
  }

  /* The card is drawn at the mockup's width (928 px). Wider columns: centered, never
     stretched. Narrower columns: the whole card scales down so proportions stay. */
  _fit() {
    const wrap = this.shadowRoot.querySelector(".wrap"), card = wrap && wrap.querySelector(".card");
    if (!card) return;
    if (!this._ro) {
      this._ro = new ResizeObserver(() => this._fit());
      this._ro.observe(this);
    }
    { // very large positions: shrink the position box text until the row fits
      const row = card.querySelector(".row2"), pos = card.querySelector(".pos");
      if (row && pos) {
        card.style.transform = "";
        let k = 1;
        pos.style.zoom = "";
        while (row.scrollWidth > row.clientWidth + 1 && k > 0.55) { k -= 0.05; pos.style.zoom = k.toFixed(2); }
      }
    }
    if (!this._adjusting && this._data && card.querySelector("svg.ch1")) {
      card.style.transform = "";
      const diff = card.offsetHeight - DESIGN_H;
      if (Math.abs(diff) > 1) {
        const h = Math.max(70, Math.min(420, (this._chartH || 190) - diff));
        if (h !== this._chartH) {
          this._chartH = h;
          this._adjusting = true;
          this._render();
          this._adjusting = false;
          return;
        }
      }
    }
    const avail = this.clientWidth || wrap.clientWidth;
    const s = Math.min(1, avail ? avail / DESIGN_W : 1);
    card.style.transform = s < 1 ? `scale(${s})` : "";
    wrap.classList.toggle("scaled", s < 1);
    wrap.style.height = s < 1 ? `${card.offsetHeight * s}px` : "";
    card.style.left = s < 1 && avail > DESIGN_W * s ? `${((avail - DESIGN_W * s) / 2).toFixed(1)}px` : "";
  }

  _openSettings() {
    const s = this._settings;
    const lim = this._limits;
    const choices = (lim.choices || DEFAULT_CHOICES).filter((c) => c >= lim.min_open);
    if (!choices.includes(s.interval)) s.interval = choices.find((c) => c >= s.interval) || choices[choices.length - 1];
    const H = this._hide;
    const ov = document.createElement("div");
    ov.className = "ov";
    ov.innerHTML = fsz(`<div class="dlg" role="dialog" aria-label="Stock Market Deluxe - Card settings">
<h2>Stock Market Deluxe - Card settings <button class="x" id="x" aria-label="Close">✕</button></h2>
<div class="f"><label>Stock symbol</label><input id="sym" value="${esc(s.symbol)}" autocomplete="off" spellcheck="false"></div>
<div class="prev" id="pv"></div>
<div class="f"><label>Shares owned</label><input id="sh" type="number" min="0" step="any" value="${s.shares}"></div>
<div class="help">Used to calculate your position value and today's change.</div>
<div class="f"><label>Current Value</label><input id="sv" type="number" min="0" step="any" value="${s.stmtValue ?? ""}"></div>
<div class="f"><label>Statement date</label><input id="sd" type="date" style="color-scheme:dark" value="${esc(s.stmtDate || "")}"></div>
<div class="help">Optional. Current Value is what your position was worth on the statement date (the date that value is from). The card starts from it and moves with the price from that day. Leave blank to use shares × price.</div>
<div class="chkh">Show on the card</div><div class="chk">${Object.entries(ITEMS).map(([k, l]) => `<label><input type="checkbox" data-k="${k}" ${H.has(k) ? "" : "checked"}>${l}</label>`).join("")}</div>
<div class="help">Hiding items gives the chart more room.</div>
<div class="f"><label>Refresh interval</label><select id="iv">${choices.map((c) => `<option value="${c}" ${c === s.interval ? "selected" : ""}>Every ${fmtInterval(c)}</option>`).join("")}</select></div>
<div class="help">Shortest is ${lim.min_open / 60} minutes while the market is open. When it is closed, quotes refresh every ${lim.min_closed / 60} minutes at most.</div>
<div class="act"><button class="b" id="cancel">CANCEL</button><button class="b p" id="save">SAVE</button></div></div>`);
    this._dlg = ov;
    this.shadowRoot.appendChild(ov);
    const $ = (id) => ov.querySelector("#" + id);
    const close = () => { ov.remove(); this._dlg = null; };
    $("x").onclick = $("cancel").onclick = close;
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    let valid = null, timer;
    const pv = $("pv"), save = $("save");
    const lookup = async () => {
      const sym = $("sym").value.trim().toUpperCase();
      if (!sym) { pv.innerHTML = ""; valid = null; save.disabled = true; return; }
      pv.innerHTML = fsz(`<span class="m" style="font-size:13px">Looking up ${esc(sym)}…</span>`);
      try {
        const { quote } = await this._hass.callWS({ type: `${DOMAIN}/lookup`, symbol: sym });
        if ($("sym").value.trim().toUpperCase() !== sym) return;
        if (!quote || !num(quote.regularMarketPrice)) { valid = null; pv.innerHTML = fsz(`<span class="r" style="font-size:13px">No stock found for ${esc(sym)}</span>`); save.disabled = true; return; }
        valid = sym; save.disabled = false;
        const ex = quote.fullExchangeName || quote.exchange || "";
        pv.innerHTML = fsz(`${logoHtml(sym, `https://financialmodelingprep.com/image-stock/${encodeURIComponent(sym)}.png`, 26).replace("max-width:26px", "width:26px")}<div><div style="font-size:15px">${esc(quote.longName || quote.shortName || sym)}</div><div style="font-size:12px;color:#9aa0a6">${esc(/^Nasdaq/i.test(ex) ? "NASDAQ" : /^NYSE/i.test(ex) ? "NYSE" : ex)} · ${esc(quote.currency || "")} · Last ${money(quote.regularMarketPrice, quote.currency)}</div></div><span style="margin-left:auto;color:#3ec46d;font-size:18px">✓</span>`);
      } catch (e) {
        valid = null; save.disabled = true;
        pv.innerHTML = fsz(`<span class="r" style="font-size:13px">${esc(e.message || "Lookup failed")}</span>`);
      }
    };
    $("sym").addEventListener("input", () => { $("sym").value = $("sym").value.toUpperCase(); clearTimeout(timer); save.disabled = true; timer = setTimeout(lookup, 700); });
    lookup();
    save.onclick = async () => {
      if (!valid) return;
      save.disabled = true;
      try {
        const msg = { type: `${DOMAIN}/settings/set`, card_id: this._sid || this._storeId, symbol: valid,
          shares: Math.max(0, Number($("sh").value) || 0), interval: Number($("iv").value) };
        const hide = [...ov.querySelectorAll(".chk input")].filter((x) => !x.checked).map((x) => x.dataset.k);
        const extra = { hide };
        const sv = $("sv").value.trim(), sd = $("sd").value;
        if (sv !== "" && Number(sv) >= 0) extra.statement_value = Number(sv);
        if (/^\d{4}-\d{2}-\d{2}$/.test(sd)) extra.statement_date = sd;
        try {
          this._stored = await this._hass.callWS({ ...msg, ...extra });
        } catch (e) {
          // an older integration may not accept "hide"
          if (!/hide|statement|extra keys/i.test(e.message || "")) throw e;
          this._stored = await this._hass.callWS(msg);
        }
        close();
        this._fetch();
      } catch (e) {
        save.disabled = false;
        pv.insertAdjacentHTML("beforeend", fsz(`<span class="r" style="font-size:12px;margin-left:8px">${esc(e.message)}</span>`));
      }
    };
    setTimeout(() => $("sym").focus(), 0);
  }
}

/* Card editor. Everything is set from the settings button on the card itself, so this only points there. */
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);

// Every card needs its own card_id so its settings are saved separately.
// The editor gives the card a fresh id when it has none, when the same id is
// already used more than once on the dashboard, or when this is a new/duplicated
// card whose id is already taken.
function idTaken(lovelace, id) {
  let n = 0;
  const walk = (o) => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === "object") {
      if (o.type === "custom:stock-market-deluxe-card" && o.card_id === id) n++;
      Object.values(o).forEach(walk);
    }
  };
  try { walk(lovelace?.config); } catch (e) { /* ignore */ }
  return n;
}

class StockMarketCardEditor extends HTMLElement {
  setConfig(c) {
    this._config = c;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<div style="padding:8px 0;line-height:1.5;color:var(--primary-text-color)">Use the settings button on the card to pick the stock, enter how many shares you own, choose how often it refreshes, and show or hide items.</div>`;
    this._checkId();
  }
  set hass(h) { this._hass = h; }
  set lovelace(l) { this._lovelace = l; this._checkId(); }
  _isNewCard() {
    for (let n = this; n; n = n.parentNode || n.host) {
      if (n.localName === "hui-dialog-edit-card") return n._params ? n._params.cardIndex === undefined : false;
    }
    return false;
  }
  _checkId() {
    const c = this._config;
    if (!c || this._fixing) return;
    const id = c.card_id;
    const used = id ? idTaken(this._lovelace, id) : 0;
    if (id && (used <= 1 && !(used === 1 && this._isNewCard()))) return;
    this._fixing = true;
    const config = { ...c, card_id: newId() };
    this._config = config;
    setTimeout(() => {
      this._fixing = false;
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
    }, 0);
  }
}

if (!customElements.get("stock-market-deluxe-card")) customElements.define("stock-market-deluxe-card", StockMarketCard);
if (!customElements.get("stock-market-deluxe-card-editor")) customElements.define("stock-market-deluxe-card-editor", StockMarketCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "stock-market-deluxe-card")) {
  window.customCards.push({ type: "stock-market-deluxe-card", name: "Stock Market Deluxe - Card", description: "Live stock quote, chart and your position. Data from Yahoo Finance.", preview: true });
}
console.info(`%c STOCK-MARKET-DELUXE-CARD %c ${VERSION} `, "background:#3ec46d;color:#000", "background:#1c1f24;color:#fff");
