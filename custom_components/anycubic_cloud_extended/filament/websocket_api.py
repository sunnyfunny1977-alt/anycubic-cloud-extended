"""Websocket commands used by the Filament Manager panel.

Read commands are available to every logged-in user, all mutating commands
require an administrator.

Record ids travel as ``manufacturer_id`` / ``material_id`` / ``item_id`` rather
than a plain ``id``: the websocket envelope reserves ``id`` for the message
number, and the client overwrites any ``id`` a caller puts in the payload. The panel keeps itself up to date through the
``subscribe`` command, which pushes a fresh snapshot after every change.
"""

from __future__ import annotations

import unicodedata
from collections.abc import Callable, Mapping
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from ..const import (
    CONF_ALLOW_NON_ADMIN_WEIGHING,
    DATA_FILAMENT_STORE,
    DEFAULT_ALLOW_NON_ADMIN_WEIGHING,
    DOMAIN,
)
from .const import SIGNAL_UPDATED, WS_PREFIX
from .material_match import MATCH_NONE, material_matches
from .store import FilamentError, FilamentStore

# Fields accepted for an inventory item. Unknown keys are ignored so the panel
# can post the whole form object.
ITEM_FIELDS: dict[Any, Any] = {
    vol.Optional("manufacturer_id"): str,
    vol.Optional("material_id"): str,
    vol.Optional("color_name"): vol.Any(str, None),
    vol.Optional("color_hex"): vol.Any(str, None),
    vol.Optional("diameter"): vol.Any(float, int, str, None),
    vol.Optional("spool_net_weight_g"): vol.Any(float, int, str, None),
    vol.Optional("sealed_count"): vol.Any(int, str, None),
    vol.Optional("location"): vol.Any(str, None),
    vol.Optional("notes"): vol.Any(str, None),
    vol.Optional("price"): vol.Any(float, int, str, None),
    vol.Optional("purchase_date"): vol.Any(str, None),
    vol.Optional("nozzle_temp"): vol.Any(int, str, None),
    vol.Optional("bed_temp"): vol.Any(int, str, None),
}

MANUFACTURER_FIELDS: dict[Any, Any] = {
    vol.Optional("name"): str,
    vol.Optional("website"): vol.Any(str, None),
    vol.Optional("sort_order"): vol.Any(int, str, None),
}

MATERIAL_FIELDS: dict[Any, Any] = {
    vol.Optional("name"): str,
    vol.Optional("ace_material_type"): vol.Any(str, None),
    vol.Optional("nozzle_temp"): vol.Any(int, str, None),
    vol.Optional("bed_temp"): vol.Any(int, str, None),
    vol.Optional("density"): vol.Any(float, int, str, None),
    vol.Optional("sort_order"): vol.Any(int, str, None),
}

SPOOL_TYPE_FIELDS: dict[Any, Any] = {
    vol.Optional("empty_weight_g"): vol.Any(float, int, str, None),
}

# The fill percentage is derived from the grams and cannot be written.
SPOOL_FIELDS: dict[Any, Any] = {
    vol.Optional("remaining_grams"): vol.Any(float, int, str, None),
    # Weighed total including the empty spool; converted by the store.
    vol.Optional("gross_weight_g"): vol.Any(float, int, str, None),
    vol.Optional("opened_at"): vol.Any(str, None),
    vol.Optional("note"): vol.Any(str, None),
}


def _get_store(hass: HomeAssistant) -> FilamentStore | None:
    """Return the store, or None when the integration is not loaded."""
    store: FilamentStore | None = hass.data.get(DOMAIN, {}).get(DATA_FILAMENT_STORE)
    return store


def _weighing_allowed(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
) -> bool:
    """Whether this user may bind and weigh spools.

    Assigning a roll to a slot and typing in what it weighs is the everyday
    job of whoever swaps the filament, not an administrative one, so it is
    open to all users by default. Installations that want it locked down can
    turn the option off; master data stays admin-only either way.
    """
    if connection.user.is_admin:
        return True
    for entry in hass.config_entries.async_entries(DOMAIN):
        if not entry.options.get(
            CONF_ALLOW_NON_ADMIN_WEIGHING, DEFAULT_ALLOW_NON_ADMIN_WEIGHING
        ):
            return False
    return True


def _payload(msg: dict[str, Any], fields: dict[Any, Any]) -> dict[str, Any]:
    """Extract the known fields the caller actually sent."""
    names = [getattr(key, "schema", key) for key in fields]
    return {name: msg[name] for name in names if name in msg}


@callback
def async_register_commands(hass: HomeAssistant) -> None:
    """Register every websocket command of this integration."""
    for handler in (
        handle_data,
        handle_subscribe,
        handle_manufacturer_create,
        handle_manufacturer_update,
        handle_manufacturer_delete,
        handle_material_create,
        handle_material_update,
        handle_material_delete,
        handle_spool_type_update,
        handle_item_create,
        handle_item_update,
        handle_item_delete,
        handle_item_set_sealed,
        handle_spool_open,
        handle_spool_update,
        handle_spool_consume,
        handle_slot_candidates,
        handle_slot_list,
        handle_slot_assign,
        handle_slot_clear,
        handle_slot_confirm,
        handle_slot_weigh,
    ):
        websocket_api.async_register_command(hass, handler)


# ----------------------------------------------------------------------
# Reading
# ----------------------------------------------------------------------


@websocket_api.websocket_command({vol.Required("type"): f"{WS_PREFIX}/data"})
@callback
def handle_data(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Send the full inventory snapshot."""
    store = _get_store(hass)
    if store is None:
        connection.send_error(msg["id"], "not_loaded", "Filament Manager is not loaded")
        return
    connection.send_result(msg["id"], store.snapshot())


@websocket_api.websocket_command({vol.Required("type"): f"{WS_PREFIX}/subscribe"})
@callback
def handle_subscribe(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Subscribe to inventory changes and push a snapshot after each one."""
    store = _get_store(hass)
    if store is None:
        connection.send_error(msg["id"], "not_loaded", "Filament Manager is not loaded")
        return

    @callback
    def _push() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], {"snapshot": store.snapshot()})
        )

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(
        hass, SIGNAL_UPDATED, _push
    )
    connection.send_result(msg["id"])
    _push()


# ----------------------------------------------------------------------
# Manufacturers (admin area)
# ----------------------------------------------------------------------


@websocket_api.websocket_command(
    {vol.Required("type"): f"{WS_PREFIX}/manufacturer/create", **MANUFACTURER_FIELDS}
)
@websocket_api.require_admin
@callback
def handle_manufacturer_create(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Create a manufacturer."""
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.add_manufacturer(_payload(msg, MANUFACTURER_FIELDS)),
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/manufacturer/update",
        vol.Required("manufacturer_id"): str,
        **MANUFACTURER_FIELDS,
    }
)
@websocket_api.require_admin
@callback
def handle_manufacturer_update(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Update a manufacturer."""
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.update_manufacturer(
            msg["manufacturer_id"], _payload(msg, MANUFACTURER_FIELDS)
        ),
    )


@websocket_api.websocket_command(
    {vol.Required("type"): f"{WS_PREFIX}/manufacturer/delete", vol.Required("manufacturer_id"): str}
)
@websocket_api.require_admin
@callback
def handle_manufacturer_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Delete a manufacturer that is not in use."""
    _answer(
        hass, connection, msg, lambda store: store.delete_manufacturer(msg["manufacturer_id"])
    )


# ----------------------------------------------------------------------
# Materials (admin area)
# ----------------------------------------------------------------------


@websocket_api.websocket_command(
    {vol.Required("type"): f"{WS_PREFIX}/material/create", **MATERIAL_FIELDS}
)
@websocket_api.require_admin
@callback
def handle_material_create(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Create a filament type."""
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.add_material(_payload(msg, MATERIAL_FIELDS)),
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/material/update",
        vol.Required("material_id"): str,
        **MATERIAL_FIELDS,
    }
)
@websocket_api.require_admin
@callback
def handle_material_update(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Update a filament type."""
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.update_material(
            msg["material_id"], _payload(msg, MATERIAL_FIELDS)
        ),
    )


@websocket_api.websocket_command(
    {vol.Required("type"): f"{WS_PREFIX}/material/delete", vol.Required("material_id"): str}
)
@websocket_api.require_admin
@callback
def handle_material_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Delete a filament type that is not in use."""
    _answer(hass, connection, msg, lambda store: store.delete_material(msg["material_id"]))


# ----------------------------------------------------------------------
# Spool types (admin area)
# ----------------------------------------------------------------------


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/spool_type/update",
        vol.Required("spool_type_id"): str,
        **SPOOL_TYPE_FIELDS,
    }
)
@websocket_api.require_admin
@callback
def handle_spool_type_update(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set the empty-spool weight; weighed spools are recomputed."""
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.update_spool_type(
            msg["spool_type_id"], _payload(msg, SPOOL_TYPE_FIELDS)
        ),
    )


# ----------------------------------------------------------------------
# Inventory items (manage area)
# ----------------------------------------------------------------------


@websocket_api.websocket_command(
    {vol.Required("type"): f"{WS_PREFIX}/item/create", **ITEM_FIELDS}
)
@websocket_api.require_admin
@callback
def handle_item_create(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Create an inventory item."""
    _answer(hass, connection, msg, lambda store: store.add_item(_payload(msg, ITEM_FIELDS)))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/item/update",
        vol.Required("item_id"): str,
        **ITEM_FIELDS,
    }
)
@websocket_api.require_admin
@callback
def handle_item_update(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Update an inventory item."""
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.update_item(msg["item_id"], _payload(msg, ITEM_FIELDS)),
    )


@websocket_api.websocket_command(
    {vol.Required("type"): f"{WS_PREFIX}/item/delete", vol.Required("item_id"): str}
)
@websocket_api.require_admin
@callback
def handle_item_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Delete an inventory item."""
    _answer(hass, connection, msg, lambda store: store.delete_item(msg["item_id"]))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/item/set_sealed",
        vol.Required("item_id"): str,
        vol.Required("sealed_count"): vol.All(vol.Coerce(int), vol.Range(min=0, max=9999)),
    }
)
@websocket_api.require_admin
@callback
def handle_item_set_sealed(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set the number of sealed spools."""
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.set_sealed_count(msg["item_id"], msg["sealed_count"]),
    )


# ----------------------------------------------------------------------
# Opened spools
# ----------------------------------------------------------------------


@websocket_api.websocket_command(
    {vol.Required("type"): f"{WS_PREFIX}/spool/open", vol.Required("item_id"): str, **SPOOL_FIELDS}
)
@websocket_api.require_admin
@callback
def handle_spool_open(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Open one sealed spool."""
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.open_spool(msg["item_id"], _payload(msg, SPOOL_FIELDS)),
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/spool/update",
        vol.Required("item_id"): str,
        vol.Required("spool_id"): str,
        **SPOOL_FIELDS,
    }
)
@websocket_api.require_admin
@callback
def handle_spool_update(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Update the remaining amount of an opened spool."""
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.update_open_spool(
            msg["item_id"], msg["spool_id"], _payload(msg, SPOOL_FIELDS)
        ),
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/spool/consume",
        vol.Required("item_id"): str,
        vol.Required("spool_id"): str,
    }
)
@websocket_api.require_admin
@callback
def handle_spool_consume(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Remove an opened spool that has been used up."""
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.consume_spool(msg["item_id"], msg["spool_id"]),
    )


def _answer(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
    action: Callable[[FilamentStore], Any],
) -> None:
    """Run a store operation and send the result or a coded error."""
    store = _get_store(hass)
    if store is None:
        connection.send_error(msg["id"], "not_loaded", "Filament Manager is not loaded")
        return
    try:
        result = action(store)
    except FilamentError as err:
        connection.send_error(msg["id"], err.code, str(err.details))
        return
    connection.send_result(msg["id"], result)


# ----------------------------------------------------------------------
# ACE slot bindings
# ----------------------------------------------------------------------

SLOT_FIELDS: dict[Any, Any] = {
    vol.Required("printer_id"): vol.Any(str, int),
    vol.Required("box_id"): vol.Coerce(int),
    vol.Required("local_slot"): vol.All(vol.Coerce(int), vol.Range(min=1, max=8)),
}


def _candidate(
    store: FilamentStore,
    item: Mapping[str, Any],
    rank: int,
) -> list[dict[str, Any]]:
    """Turn one inventory item into its selectable opened spools."""
    net = float(item.get("spool_net_weight_g") or 0)
    tare = store.item_tare(item)
    label = store.item_label(item)
    out = []
    for spool in item.get("open_spools", []):
        remaining = spool.get("remaining_grams")
        out.append(
            {
                "item_id": item["id"],
                "spool_id": spool["id"],
                "label": label,
                "color_hex": item.get("color_hex"),
                "material_id": item.get("material_id"),
                "remaining_grams": remaining,
                "remaining_percent": (
                    None if not net or remaining is None else round(remaining / net * 100, 1)
                ),
                "net_weight_g": net,
                "tare_g": tare,
                "match_rank": rank,
                "sealed_available": int(item.get("sealed_count") or 0) > 0,
                "note": spool.get("note"),
            }
        )
    if not out and int(item.get("sealed_count") or 0) > 0:
        # Nothing opened yet, but there is a sealed roll to open. Offered as a
        # candidate without a spool id; assigning it opens the roll.
        out.append(
            {
                "item_id": item["id"],
                "spool_id": None,
                "label": label,
                "color_hex": item.get("color_hex"),
                "material_id": item.get("material_id"),
                "remaining_grams": net or None,
                "remaining_percent": 100.0 if net else None,
                "net_weight_g": net,
                "tare_g": tare,
                "match_rank": rank,
                "sealed_available": True,
                "note": "",
            }
        )
    return out


def _sort_key(label: str) -> tuple[str, str]:
    """Case- and accent-insensitive sort key, with the original as tiebreak."""
    folded = unicodedata.normalize("NFKD", label).casefold()
    stripped = "".join(ch for ch in folded if not unicodedata.combining(ch))
    return (stripped, label)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/slot/candidates",
        **SLOT_FIELDS,
        vol.Optional("material_type"): vol.Any(str, None),
        vol.Optional("include_non_matching", default=False): bool,
    }
)
@callback
def handle_slot_candidates(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """List the spools that fit what a slot currently holds.

    The filtering happens here rather than in the panel so that the rules used
    to offer a spool are exactly the rules used to accept one, and so the card
    does not have to pull the whole inventory to show four rolls.
    """
    store = _get_store(hass)
    if store is None:
        connection.send_error(msg["id"], "not_loaded", "Filament Manager is not loaded")
        return

    ace_type = msg.get("material_type")
    include_all = bool(msg.get("include_non_matching"))

    ranks = {}
    for material in store.materials:
        rank = material_matches(ace_type, material)
        if rank > MATCH_NONE or include_all:
            ranks[material["id"]] = max(rank, MATCH_NONE)

    candidates: list[dict[str, Any]] = []
    for item in store.items:
        material_id = item.get("material_id")
        if material_id not in ranks:
            continue
        candidates.extend(_candidate(store, item, ranks[material_id]))

    # By name. The list only holds materials that fit the slot, so the match
    # rank barely varies within it, and a name is what somebody scans a
    # dropdown for. Accents fold into their base letter first, so Ökofilament
    # sorts under O rather than after Z.
    candidates.sort(key=lambda c: _sort_key(c["label"]))

    assignment = store.find_assignment(
        msg["printer_id"], msg["box_id"], msg["local_slot"]
    )
    detail = None if assignment is None else store.assignment_detail(assignment)

    connection.send_result(
        msg["id"],
        {
            "material_type": ace_type,
            "assignment": detail,
            "candidates": candidates,
            "needs_tare": bool(detail is not None and detail.get("tare_g") is None),
            "can_write": _weighing_allowed(hass, connection),
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/slot/list",
        vol.Optional("printer_id"): vol.Any(str, int, None),
    }
)
@callback
def handle_slot_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """List every slot binding, optionally for one printer."""
    store = _get_store(hass)
    if store is None:
        connection.send_error(msg["id"], "not_loaded", "Filament Manager is not loaded")
        return

    wanted = msg.get("printer_id")
    entries = [
        {**entry, "detail": store.assignment_detail(entry)}
        for entry in store.assignments
        if wanted is None or str(entry["printer_id"]) == str(wanted)
    ]
    connection.send_result(msg["id"], {"assignments": entries})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/slot/assign",
        **SLOT_FIELDS,
        vol.Required("item_id"): str,
        vol.Optional("spool_id"): vol.Any(str, None),
        vol.Optional("source"): vol.Any(str, None),
        vol.Optional("fingerprint"): vol.Any(str, None),
        vol.Optional("fp_material_type"): vol.Any(str, None),
        vol.Optional("fp_color_hex"): vol.Any(str, None),
        vol.Optional("fp_sku"): vol.Any(str, None),
    }
)
@callback
def handle_slot_assign(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Bind a spool from the inventory to one ACE slot."""
    if not _weighing_allowed(hass, connection):
        connection.send_error(msg["id"], "unauthorized", "Not allowed to assign spools")
        return

    fields = (
        "printer_id",
        "box_id",
        "local_slot",
        "item_id",
        "spool_id",
        "source",
        "fingerprint",
        "fp_material_type",
        "fp_color_hex",
        "fp_sku",
    )
    payload = {name: msg[name] for name in fields if name in msg}
    payload["printer_id"] = str(payload["printer_id"])
    _answer(hass, connection, msg, lambda store: store.set_assignment(payload))


@websocket_api.websocket_command(
    {vol.Required("type"): f"{WS_PREFIX}/slot/clear", **SLOT_FIELDS}
)
@callback
def handle_slot_clear(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Remove the binding of one ACE slot."""
    if not _weighing_allowed(hass, connection):
        connection.send_error(msg["id"], "unauthorized", "Not allowed to clear spools")
        return
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.clear_assignment(
            str(msg["printer_id"]), msg["box_id"], msg["local_slot"]
        ),
    )


@websocket_api.websocket_command(
    {vol.Required("type"): f"{WS_PREFIX}/slot/confirm", **SLOT_FIELDS}
)
@callback
def handle_slot_confirm(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Accept a slot as it stands and clear the swap mark.

    The mark is a question put to the user, and this is the answer. Deduction
    resumes from here, so it needs the same permission as binding a slot.
    """
    if not _weighing_allowed(hass, connection):
        connection.send_error(
            msg["id"], "unauthorized", "Not allowed to confirm slots"
        )
        return
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.confirm_assignment(
            str(msg["printer_id"]), msg["box_id"], msg["local_slot"]
        ),
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{WS_PREFIX}/slot/weigh",
        **SLOT_FIELDS,
        vol.Required("gross_weight_g"): vol.All(
            vol.Coerce(float), vol.Range(min=0, max=100000)
        ),
        vol.Optional("empty_weight_g"): vol.Any(
            vol.All(vol.Coerce(float), vol.Range(min=0, max=100000)), None
        ),
    }
)
@callback
def handle_slot_weigh(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Book a scale reading for the spool bound to a slot.

    Sending the empty-spool weight along saves a round trip: without a tare
    the store raises ``no_empty_weight``, which is the frontend's cue to ask
    for one and call again.
    """
    if not _weighing_allowed(hass, connection):
        connection.send_error(msg["id"], "unauthorized", "Not allowed to weigh spools")
        return
    _answer(
        hass,
        connection,
        msg,
        lambda store: store.weigh_assignment(
            str(msg["printer_id"]),
            msg["box_id"],
            msg["local_slot"],
            msg["gross_weight_g"],
            msg.get("empty_weight_g"),
        ),
    )
