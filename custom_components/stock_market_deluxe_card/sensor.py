from __future__ import annotations

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, SIGNAL_NEW, SIGNAL_UPDATE

ATTRS = {
    "name": "longName", "exchange": "fullExchangeName", "market_state": "marketState",
    "change": "regularMarketChange", "change_percent": "regularMarketChangePercent",
    "open": "regularMarketOpen", "day_high": "regularMarketDayHigh", "day_low": "regularMarketDayLow",
    "previous_close": "regularMarketPreviousClose", "volume": "regularMarketVolume",
    "average_volume": "averageDailyVolume3Month", "market_cap": "marketCap", "pe": "trailingPE",
    "eps": "epsTrailingTwelveMonths", "52w_high": "fiftyTwoWeekHigh", "52w_low": "fiftyTwoWeekLow",
    "post_market_price": "postMarketPrice", "pre_market_price": "preMarketPrice",
}


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, add: AddEntitiesCallback) -> None:
    hub = hass.data[DOMAIN]["hub"]
    known: set[str] = set()

    @callback
    def _new(symbols: set[str]) -> None:
        fresh = [s for s in symbols if s not in known and hub.symbols.get(s) and hub.symbols[s].quote]
        known.update(fresh)
        if fresh:
            add([StockSensor(hub, s) for s in fresh])

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_NEW, _new))
    _new(set(hub.symbols))


class StockSensor(SensorEntity):
    _attr_should_poll = False
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:chart-line"

    def __init__(self, hub, symbol: str) -> None:
        self._hub = hub
        self._sym = symbol
        self._attr_unique_id = f"{DOMAIN}_{symbol.lower()}"
        self._attr_name = f"Stock {symbol}"
        self.entity_id = f"sensor.stock_{symbol.lower().replace('-', '_').replace('.', '_').replace('^', '')}"

    @property
    def _q(self) -> dict:
        s = self._hub.symbols.get(self._sym)
        return (s.quote if s else None) or {}

    @property
    def native_value(self):
        return self._q.get("regularMarketPrice")

    @property
    def native_unit_of_measurement(self):
        return self._q.get("currency")

    @property
    def extra_state_attributes(self):
        q = self._q
        a = {k: q.get(v) for k, v in ATTRS.items()}
        a["symbol"] = self._sym
        s = self._hub.symbols.get(self._sym)
        a["beta"] = s.beta if s else None
        return a

    async def async_added_to_hass(self) -> None:
        @callback
        def _upd(symbols: set[str]) -> None:
            if self._sym in symbols:
                self.async_write_ha_state()
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_UPDATE, _upd))
