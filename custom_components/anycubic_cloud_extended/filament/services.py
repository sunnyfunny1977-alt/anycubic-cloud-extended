"""Services for the filament inventory.

The four inventory services are carried over unchanged from the standalone
Filament Manager; three more bind a spool to an ACE slot, release it again and
book a scale reading. They exist alongside the websocket commands so the same
things can be done from an automation or an NFC tag, not just from the panel.
"""

from __future__ import annotations

from typing import Any, Callable

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from ..const import DATA_FILAMENT_STORE, DOMAIN, LOGGER
from .const import (
    SERVICE_ADD_SPOOLS,
    SERVICE_CONSUME_SPOOL,
    SERVICE_OPEN_SPOOL,
    SERVICE_SET_REMAINING,
)
from .store import FilamentError, FilamentStore

SERVICE_ASSIGN_SLOT_SPOOL = "assign_slot_spool"
SERVICE_CLEAR_SLOT_SPOOL = "clear_slot_spool"
SERVICE_WEIGH_SLOT_SPOOL = "weigh_slot_spool"

_WEIGHT = vol.All(vol.Coerce(float), vol.Range(min=0, max=100000))

SERVICE_ADD_SPOOLS_SCHEMA = vol.Schema(
    {
        vol.Required("item_id"): cv.string,
        vol.Optional("count", default=1): vol.All(
            vol.Coerce(int), vol.Range(min=-999, max=999)
        ),
    }
)

SERVICE_OPEN_SPOOL_SCHEMA = vol.Schema({vol.Required("item_id"): cv.string})

SERVICE_SET_REMAINING_SCHEMA = vol.Schema(
    {
        vol.Required("item_id"): cv.string,
        vol.Optional("spool_id"): cv.string,
        vol.Optional("remaining_grams"): _WEIGHT,
        vol.Optional("gross_weight_g"): _WEIGHT,
        vol.Optional("note"): cv.string,
    }
)

SERVICE_CONSUME_SPOOL_SCHEMA = vol.Schema(
    {vol.Required("item_id"): cv.string, vol.Optional("spool_id"): cv.string}
)

# The slot number is the 1-based slot within its box, matching the
# `slot_number` field of the multi_color_box_* services.
_SLOT_SCHEMA = {
    vol.Required("printer_id"): vol.Any(cv.string, int),
    vol.Optional("box_id", default=0): vol.All(vol.Coerce(int), vol.Range(min=-1, max=7)),
    vol.Required("slot_number"): vol.All(vol.Coerce(int), vol.Range(min=1, max=4)),
}

SERVICE_ASSIGN_SLOT_SPOOL_SCHEMA = vol.Schema(
    {
        **_SLOT_SCHEMA,
        vol.Required("item_id"): cv.string,
        vol.Optional("spool_id"): cv.string,
    }
)

SERVICE_CLEAR_SLOT_SPOOL_SCHEMA = vol.Schema(dict(_SLOT_SCHEMA))

SERVICE_WEIGH_SLOT_SPOOL_SCHEMA = vol.Schema(
    {
        **_SLOT_SCHEMA,
        vol.Required("gross_weight_g"): _WEIGHT,
        vol.Optional("empty_weight_g"): _WEIGHT,
    }
)


def _get_store(hass: HomeAssistant) -> FilamentStore:
    """Return the loaded inventory or fail loudly."""
    store: FilamentStore | None = hass.data.get(DOMAIN, {}).get(DATA_FILAMENT_STORE)
    if store is None:
        raise HomeAssistantError("The filament inventory is not loaded")
    return store


def _resolve_spool_id(store: FilamentStore, item_id: str, given: str | None) -> str:
    """Return the spool to act on, defaulting to the first opened one."""
    for item in store.items:
        if item["id"] != item_id:
            continue
        if given:
            return given
        if not item["open_spools"]:
            raise HomeAssistantError(f"Item {item_id} has no opened spool")
        if len(item["open_spools"]) > 1:
            LOGGER.warning(
                "Item %s has %d opened spools and none was named; using the first",
                item_id,
                len(item["open_spools"]),
            )
        return item["open_spools"][0]["id"]
    raise HomeAssistantError(f"Unknown item {item_id}")


def make_inventory_handler(hass: HomeAssistant) -> Callable:
    """Return the handler shared by the four inventory services."""

    async def _handle(call: ServiceCall) -> None:
        store = _get_store(hass)
        data: dict[str, Any] = dict(call.data)
        item_id = data["item_id"]
        try:
            if call.service == SERVICE_ADD_SPOOLS:
                current = next(
                    (
                        item["sealed_count"]
                        for item in store.items
                        if item["id"] == item_id
                    ),
                    None,
                )
                if current is None:
                    raise HomeAssistantError(f"Unknown item {item_id}")
                store.set_sealed_count(item_id, current + data["count"])
            elif call.service == SERVICE_OPEN_SPOOL:
                store.open_spool(item_id)
            elif call.service == SERVICE_SET_REMAINING:
                spool_id = _resolve_spool_id(store, item_id, data.get("spool_id"))
                payload = {
                    key: data[key]
                    for key in ("remaining_grams", "gross_weight_g", "note")
                    if key in data
                }
                store.update_open_spool(item_id, spool_id, payload)
            elif call.service == SERVICE_CONSUME_SPOOL:
                spool_id = _resolve_spool_id(store, item_id, data.get("spool_id"))
                store.consume_spool(item_id, spool_id)
        except FilamentError as err:
            raise HomeAssistantError(f"{err.code}: {err.details}") from err

    return _handle


def make_slot_handler(hass: HomeAssistant) -> Callable:
    """Return the handler shared by the three slot services."""

    async def _handle(call: ServiceCall) -> None:
        store = _get_store(hass)
        data: dict[str, Any] = dict(call.data)
        printer_id = str(data["printer_id"])
        box_id = data.get("box_id", 0)
        local_slot = data["slot_number"]
        try:
            if call.service == SERVICE_ASSIGN_SLOT_SPOOL:
                store.set_assignment(
                    {
                        "printer_id": printer_id,
                        "box_id": box_id,
                        "local_slot": local_slot,
                        "item_id": data["item_id"],
                        "spool_id": data.get("spool_id"),
                        "needs_weighing": True,
                    }
                )
            elif call.service == SERVICE_CLEAR_SLOT_SPOOL:
                store.clear_assignment(printer_id, box_id, local_slot)
            elif call.service == SERVICE_WEIGH_SLOT_SPOOL:
                store.weigh_assignment(
                    printer_id,
                    box_id,
                    local_slot,
                    data["gross_weight_g"],
                    data.get("empty_weight_g"),
                )
        except FilamentError as err:
            raise HomeAssistantError(f"{err.code}: {err.details}") from err

    return _handle


# (service name, handler factory, schema)
FILAMENT_SERVICES: tuple[tuple[str, Callable, vol.Schema], ...] = (
    (SERVICE_ADD_SPOOLS, make_inventory_handler, SERVICE_ADD_SPOOLS_SCHEMA),
    (SERVICE_OPEN_SPOOL, make_inventory_handler, SERVICE_OPEN_SPOOL_SCHEMA),
    (SERVICE_SET_REMAINING, make_inventory_handler, SERVICE_SET_REMAINING_SCHEMA),
    (SERVICE_CONSUME_SPOOL, make_inventory_handler, SERVICE_CONSUME_SPOOL_SCHEMA),
    (SERVICE_ASSIGN_SLOT_SPOOL, make_slot_handler, SERVICE_ASSIGN_SLOT_SPOOL_SCHEMA),
    (SERVICE_CLEAR_SLOT_SPOOL, make_slot_handler, SERVICE_CLEAR_SLOT_SPOOL_SCHEMA),
    (SERVICE_WEIGH_SLOT_SPOOL, make_slot_handler, SERVICE_WEIGH_SLOT_SPOOL_SCHEMA),
)
