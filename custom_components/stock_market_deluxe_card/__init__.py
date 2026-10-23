"""Stock Market Deluxe - Card: Yahoo Finance quotes plus a bundled Lovelace card."""
from __future__ import annotations

import logging
from datetime import timedelta
from pathlib import Path

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_create_clientsession
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.storage import Store

from .const import (
    CARD_FILE, CARD_URL, DOMAIN, INTERVAL_CHOICES, SIGNAL_NEW, SIGNAL_UPDATE,
    STORE_KEY, STORE_VERSION, URL_BASE, VERSION,
)
from .yahoo import MIN_CLOSED, MIN_OPEN, RANGES, RateLimited, StockHub, clamp_interval

_LOGGER = logging.getLogger(__name__)
PLATFORMS = ["sensor"]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    data = hass.data.setdefault(DOMAIN, {})
    if not data.get("static"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(URL_BASE, str(Path(__file__).parent / "frontend"), False)]
        )
        data["static"] = True
    _register_ws(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    data = hass.data.setdefault(DOMAIN, {})
    hub = StockHub(async_create_clientsession(hass))
    store = Store(hass, STORE_VERSION, STORE_KEY)
    data["hub"] = hub
    data["store"] = store
    data["cards"] = await store.async_load() or {}

    # Pre-track symbols saved by cards so their sensors come back after restart.
    for cfg in data["cards"].values():
        if cfg.get("symbol"):
            hub.track(cfg["symbol"], cfg.get("interval"))

    @callback
    def _updated(symbols: set[str]) -> None:
        async_dispatcher_send(hass, SIGNAL_NEW, symbols)
        async_dispatcher_send(hass, SIGNAL_UPDATE, symbols)

    hub.listeners.append(_updated)

    async def _tick(_now=None) -> None:
        await hub.tick()

    entry.async_on_unload(async_track_time_interval(hass, _tick, timedelta(seconds=30)))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_create_background_task(hass, _tick(), "stock_market_deluxe_card first tick")
    await _register_resource(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok:
        hass.data[DOMAIN].pop("hub", None)
    return ok


async def _register_resource(hass: HomeAssistant) -> None:
    """Add the card JS as a Lovelace resource, like WebRTC and browser_mod do."""
    url = f"{CARD_URL}?v={VERSION}"
    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None)
    if resources is None and isinstance(lovelace, dict):
        resources = lovelace.get("resources")
    mode = getattr(lovelace, "resource_mode", None) or getattr(lovelace, "mode", None)
    if isinstance(lovelace, dict):
        mode = mode or lovelace.get("mode")
    if resources is None or mode == "yaml" or not hasattr(resources, "async_create_item"):
        _LOGGER.debug("Lovelace resources not writable, using add_extra_js_url")
        from homeassistant.components.frontend import add_extra_js_url
        add_extra_js_url(hass, url)
        return
    if not getattr(resources, "loaded", True):
        await resources.async_load()
        resources.loaded = True
    for item in resources.async_items():
        if item.get("url", "").split("?")[0] == CARD_URL:
            if item["url"] != url:
                await resources.async_update_item(item["id"], {"res_type": "module", "url": url})
            return
    await resources.async_create_item({"res_type": "module", "url": url})


def _hub(hass: HomeAssistant, connection, msg) -> StockHub | None:
    hub = hass.data.get(DOMAIN, {}).get("hub")
    if hub is None:
        connection.send_error(msg["id"], "not_loaded", "Stock Market Deluxe - Card integration is not set up")
    return hub


@callback
def _register_ws(hass: HomeAssistant) -> None:
    if hass.data[DOMAIN].get("ws"):
        return
    hass.data[DOMAIN]["ws"] = True
    for fn in (ws_data, ws_lookup, ws_settings_get, ws_settings_set, ws_limits):
        websocket_api.async_register_command(hass, fn)


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/data",
    vol.Required("symbol"): vol.All(str, vol.Length(min=1, max=15)),
    vol.Optional("range", default="1D"): vol.In(list(RANGES)),
    vol.Optional("interval"): vol.Coerce(int),
})
@websocket_api.async_response
async def ws_data(hass, connection, msg):
    if not (hub := _hub(hass, connection, msg)):
        return
    known = set(hub.symbols)
    snap = await hub.snapshot(msg["symbol"], msg["range"], msg.get("interval"))
    if snap["symbol"] not in known and snap["quote"]:
        async_dispatcher_send(hass, SIGNAL_NEW, {snap["symbol"]})
    connection.send_result(msg["id"], snap)


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/lookup",
    vol.Required("symbol"): str,
})
@websocket_api.async_response
async def ws_lookup(hass, connection, msg):
    if not (hub := _hub(hass, connection, msg)):
        return
    try:
        q = await hub.lookup(msg["symbol"])
    except RateLimited:
        connection.send_error(msg["id"], "rate_limited", "Yahoo is rate limiting, try again later")
        return
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "failed", str(err))
        return
    connection.send_result(msg["id"], {"quote": q})


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/settings/get",
    vol.Required("card_id"): str,
})
@callback
def ws_settings_get(hass, connection, msg):
    connection.send_result(msg["id"], hass.data[DOMAIN].get("cards", {}).get(msg["card_id"]))


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/settings/set",
    vol.Required("card_id"): vol.All(str, vol.Length(min=1, max=64)),
    vol.Required("symbol"): vol.All(str, vol.Length(min=1, max=15)),
    vol.Required("shares"): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Required("interval"): vol.All(vol.Coerce(int), vol.Range(min=MIN_OPEN)),
    vol.Optional("statement_value"): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Optional("statement_date"): vol.All(str, vol.Date()),
    vol.Optional("hide"): [vol.In(["position", "tabs", "legend", "volbars", "rsi", "open", "high", "low", "prev", "vol", "cap", "w52", "pe", "eps", "beta", "ah"])],
})
@websocket_api.async_response
async def ws_settings_set(hass, connection, msg):
    if not (hub := _hub(hass, connection, msg)):
        return
    cfg = {
        "symbol": msg["symbol"].upper().strip(),
        "shares": msg["shares"],
        "interval": clamp_interval(msg["interval"], True),
    }
    for key in ("hide", "statement_value", "statement_date"):
        if key in msg:
            cfg[key] = msg[key]
    cards = hass.data[DOMAIN]["cards"]
    cards[msg["card_id"]] = cfg
    await hass.data[DOMAIN]["store"].async_save(cards)
    hub.track(cfg["symbol"], cfg["interval"])
    connection.send_result(msg["id"], cfg)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/limits"})
@callback
def ws_limits(hass, connection, msg):
    connection.send_result(msg["id"], {
        "min_open": MIN_OPEN, "min_closed": MIN_CLOSED, "choices": INTERVAL_CHOICES, "version": VERSION,
    })
