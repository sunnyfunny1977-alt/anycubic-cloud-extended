"""Data model helpers for the Filament Manager.

The store keeps four flat lists: manufacturers, materials, spool types and items.
An *item* is one combination of manufacturer + material + colour. It carries the
number of sealed (unopened) spools plus a list of opened spools, each with its
own remaining amount.

A *spool type* is the physical spool behind an item — manufacturer + material +
size. It holds the weight of the bare spool, because that is a property of the
spool and not of the colour wound onto it.
"""

from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime
from typing import Any, TypedDict
from uuid import uuid4

from homeassistant.util import dt as dt_util

from ..const import LOGGER
from .const import (
    DEFAULT_DIAMETER,
    DEFAULT_MANUFACTURERS,
    DEFAULT_MATERIALS,
    DEFAULT_SPOOL_NET_WEIGHT_G,
)


class Manufacturer(TypedDict):
    """A filament brand."""

    id: str
    name: str
    website: str
    sort_order: int


class Material(TypedDict):
    """A filament type such as PLA or PETG, with its default temperatures."""

    id: str
    name: str
    nozzle_temp: int | None
    bed_temp: int | None
    density: float | None
    sort_order: int
    # Optional explicit mapping onto an ACE material type ("PLA", "PETG", ...).
    # None means "derive it from the name", which is correct for every default
    # material. Set it only when the automatic match gets a special name wrong.
    ace_material_type: str | None


class SpoolType(TypedDict):
    """The bare spool behind a group of items.

    Identified by manufacturer + material + size: a 250 g spool weighs less
    empty than a 1 kg one, even for the same filament.
    """

    id: str
    manufacturer_id: str
    material_id: str
    net_weight_g: float
    empty_weight_g: float | None
    created_at: str


class OpenSpool(TypedDict):
    """A single opened spool with its own remaining amount.

    The amount is kept in grams only. The percentage everybody reads off the
    UI is derived from it, so the two can never drift apart.
    """

    id: str
    remaining_grams: float | None
    # What the scale last read for the whole spool. Kept so a corrected
    # empty-spool weight can recompute the remaining amount.
    gross_weight_g: float | None
    opened_at: str | None
    note: str


class Item(TypedDict):
    """One manufacturer + material + colour combination."""

    id: str
    manufacturer_id: str
    material_id: str
    color_name: str
    color_hex: str
    diameter: float
    spool_net_weight_g: float
    sealed_count: int
    open_spools: list[OpenSpool]
    location: str
    notes: str
    price: float | None
    purchase_date: str | None
    nozzle_temp: int | None
    bed_temp: int | None
    created_at: str
    updated_at: str


class SlotAssignment(TypedDict):
    """Binds one physical ACE slot to one opened spool from the inventory.

    The persistence key is (printer_id, box_id, local_slot). ``local_slot`` is
    always the 1-based slot number *within its box* — never the 0-based
    ``AnycubicSpoolInfo.index`` and never the global ``display_slot``, which
    shifts around depending on how many boxes and racks are attached.

    ``fingerprint`` is what the ACE reported for the slot when the binding was
    made. When it no longer matches, the spool was swapped and the user has to
    re-weigh (and possibly re-assign).
    """

    id: str
    printer_id: str
    box_id: int
    local_slot: int
    source: str
    item_id: str
    spool_id: str
    fingerprint: str
    fp_material_type: str
    fp_color_hex: str
    fp_sku: str
    fp_status: int | None
    stale: bool
    # Set when automatic deduction ran the spool down to zero. The estimate and
    # the real spool have parted ways at that point, so it is worth saying so
    # rather than quietly showing 0 g.
    depleted: bool
    depleted_since: str | None
    stale_since: str | None
    assigned_at: str
    weighed_at: str | None


def new_id() -> str:
    """Return a short unique id."""
    return uuid4().hex[:12]


def utcnow_iso() -> str:
    """Return the current time as an ISO string."""
    return dt_util.utcnow().isoformat(timespec="seconds")


def _str(value: Any, default: str = "") -> str:
    """Coerce a value into a stripped string."""
    if value is None:
        return default
    return str(value).strip()


def _opt_number(
    value: Any, minimum: float | None = None, maximum: float | None = None
) -> float | None:
    """Coerce a value into an optional, clamped float.

    Empty input means the field is not set, which is different from zero.
    """
    if value is None or value == "":
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if minimum is not None:
        number = max(minimum, number)
    if maximum is not None:
        number = min(maximum, number)
    return number


def _opt_int(
    value: Any, minimum: int | None = None, maximum: int | None = None
) -> int | None:
    """Coerce a value into an optional, clamped int."""
    number = _opt_number(value, minimum, maximum)
    return None if number is None else int(round(number))


def _opt_date(value: Any) -> str | None:
    """Keep a YYYY-MM-DD date string, dropping anything unparseable."""
    text = _str(value)
    if not text:
        return None
    try:
        return datetime.strptime(text[:10], "%Y-%m-%d").date().isoformat()
    except ValueError:
        return None


def _hex_color(value: Any, default: str = "#9e9e9e") -> str:
    """Normalise a colour into #rrggbb form."""
    text = _str(value).lstrip("#").lower()
    if len(text) == 3 and all(char in "0123456789abcdef" for char in text):
        text = "".join(char * 2 for char in text)
    if len(text) == 6 and all(char in "0123456789abcdef" for char in text):
        return f"#{text}"
    return default


def normalize_manufacturer(
    raw: dict[str, Any], existing: Mapping[str, Any] | None = None
) -> Manufacturer:
    """Build a valid manufacturer record from user input."""
    base: dict[str, Any] = dict(existing or {})
    base.update(raw)
    return {
        "id": base.get("id") or new_id(),
        "name": _str(base.get("name")),
        "website": _str(base.get("website")),
        "sort_order": _opt_int(base.get("sort_order"), 0, 9999) or 0,
    }


def normalize_material(
    raw: dict[str, Any], existing: Mapping[str, Any] | None = None
) -> Material:
    """Build a valid material record from user input."""
    base: dict[str, Any] = dict(existing or {})
    base.update(raw)
    return {
        "id": base.get("id") or new_id(),
        "name": _str(base.get("name")),
        "nozzle_temp": _opt_int(base.get("nozzle_temp"), 0, 600),
        "bed_temp": _opt_int(base.get("bed_temp"), 0, 300),
        "density": _opt_number(base.get("density"), 0.1, 10),
        "sort_order": _opt_int(base.get("sort_order"), 0, 9999) or 0,
        "ace_material_type": _str(base.get("ace_material_type")).upper() or None,
    }


def spool_type_key(manufacturer_id: Any, material_id: Any, net_weight_g: Any) -> tuple:
    """Return the business key of a spool type.

    The size is rounded to whole grams so 1000 and 1000.0 are the same spool.
    """
    net = _opt_number(net_weight_g, 1, 100000) or DEFAULT_SPOOL_NET_WEIGHT_G
    return (_str(manufacturer_id), _str(material_id), int(round(net)))


def normalize_spool_type(
    raw: dict[str, Any], existing: Mapping[str, Any] | None = None
) -> SpoolType:
    """Build a valid spool-type record from user input."""
    base: dict[str, Any] = dict(existing or {})
    base.update(raw)
    return {
        "id": base.get("id") or new_id(),
        "manufacturer_id": _str(base.get("manufacturer_id")),
        "material_id": _str(base.get("material_id")),
        "net_weight_g": _opt_number(base.get("net_weight_g"), 1, 100000)
        or DEFAULT_SPOOL_NET_WEIGHT_G,
        "empty_weight_g": _opt_number(base.get("empty_weight_g"), 0, 100000),
        "created_at": _str(base.get("created_at")) or utcnow_iso(),
    }


def normalize_open_spool(
    raw: dict[str, Any], existing: Mapping[str, Any] | None = None
) -> OpenSpool:
    """Build a valid opened-spool record."""
    base: dict[str, Any] = dict(existing or {})
    base.update(raw)
    return {
        "id": base.get("id") or new_id(),
        "remaining_grams": _opt_number(base.get("remaining_grams"), 0, 100000),
        "gross_weight_g": _opt_number(base.get("gross_weight_g"), 0, 100000),
        "opened_at": _opt_date(base.get("opened_at")) or dt_util.now().date().isoformat(),
        "note": _str(base.get("note")),
    }


def normalize_item(raw: dict[str, Any], existing: Mapping[str, Any] | None = None) -> Item:
    """Build a valid item record from user input."""
    base: dict[str, Any] = dict(existing or {})
    base.update(raw)

    spools_raw = base.get("open_spools") or []
    open_spools = [
        normalize_open_spool(spool) for spool in spools_raw if isinstance(spool, dict)
    ]

    return {
        "id": base.get("id") or new_id(),
        "manufacturer_id": _str(base.get("manufacturer_id")),
        "material_id": _str(base.get("material_id")),
        "color_name": _str(base.get("color_name")),
        "color_hex": _hex_color(base.get("color_hex")),
        "diameter": _opt_number(base.get("diameter"), 0.5, 5) or DEFAULT_DIAMETER,
        "spool_net_weight_g": _opt_number(base.get("spool_net_weight_g"), 1, 100000)
        or DEFAULT_SPOOL_NET_WEIGHT_G,
        "sealed_count": _opt_int(base.get("sealed_count"), 0, 9999) or 0,
        "open_spools": open_spools,
        "location": _str(base.get("location")),
        "notes": _str(base.get("notes")),
        "price": _opt_number(base.get("price"), 0, 100000),
        "purchase_date": _opt_date(base.get("purchase_date")),
        "nozzle_temp": _opt_int(base.get("nozzle_temp"), 0, 600),
        "bed_temp": _opt_int(base.get("bed_temp"), 0, 300),
        "created_at": _str(base.get("created_at")) or utcnow_iso(),
        "updated_at": utcnow_iso(),
    }


def net_from_gross(gross_weight_g: float, empty_weight_g: float) -> float:
    """Return the filament left on a weighed spool.

    The scale shows filament plus the empty spool, so the tare has to come off.
    A spool cannot weigh less than nothing, hence the clamp.
    """
    return max(0.0, float(gross_weight_g) - float(empty_weight_g))


def spool_remaining_grams(spool: OpenSpool, net_weight_g: float) -> float:
    """Return the remaining grams of one opened spool."""
    grams = spool.get("remaining_grams")
    return 0.0 if grams is None else float(grams)


def spool_remaining_percent(spool: OpenSpool, net_weight_g: float) -> float | None:
    """Return how full an opened spool is, derived from its weight.

    None when nothing is known yet. Values above 100 % are clamped, because a
    spool holding more than its nominal fill is a measuring error rather than
    a fuller spool.
    """
    grams = spool.get("remaining_grams")
    net = float(net_weight_g or 0)
    if grams is None or net <= 0:
        return None
    return round(min(100.0, max(0.0, float(grams) / net * 100)), 1)


def item_total_spools(item: Item) -> int:
    """Return the number of physical spools of an item (sealed plus opened)."""
    return int(item.get("sealed_count", 0)) + len(item.get("open_spools", []))


def item_total_grams(item: Item) -> float:
    """Return the total filament of an item in grams."""
    net = float(item.get("spool_net_weight_g") or DEFAULT_SPOOL_NET_WEIGHT_G)
    total = int(item.get("sealed_count", 0)) * net
    for spool in item.get("open_spools", []):
        total += spool_remaining_grams(spool, net)
    return total


def assignment_key(printer_id: Any, box_id: Any, local_slot: Any) -> tuple:
    """Return the business key of a slot assignment.

    ``printer_id`` is always a string: it survives a JSON round trip that way,
    which is the same trick the coordinator uses for its ACE state store.
    """
    return (
        _str(printer_id),
        _opt_int(box_id, -1, 15) if box_id is not None else -1,
        _opt_int(local_slot, 0, 8) or 0,
    )


def normalize_assignment(
    raw: dict[str, Any], existing: Mapping[str, Any] | None = None
) -> SlotAssignment:
    """Build a valid slot assignment from user input."""
    base: dict[str, Any] = dict(existing or {})
    base.update(raw)
    local_slot = _opt_int(base.get("local_slot"), 0, 8) or 0
    if local_slot == 0:
        LOGGER.warning(
            "Slot assignment for printer %s box %s has an invalid local_slot %r; "
            "expected 1..4 (never the 0-based index)",
            base.get("printer_id"),
            base.get("box_id"),
            base.get("local_slot"),
        )
    box_id = _opt_int(base.get("box_id"), -1, 15)

    return {
        "id": base.get("id") or new_id(),
        "printer_id": _str(base.get("printer_id")),
        "box_id": -1 if box_id is None else box_id,
        "local_slot": local_slot,
        "source": _str(base.get("source")) or "ace",
        "item_id": _str(base.get("item_id")),
        "spool_id": _str(base.get("spool_id")),
        "fingerprint": _str(base.get("fingerprint")),
        "fp_material_type": _str(base.get("fp_material_type")),
        "fp_color_hex": _str(base.get("fp_color_hex")),
        "fp_sku": _str(base.get("fp_sku")),
        "fp_status": _opt_int(base.get("fp_status"), 0, 255),
        "stale": bool(base.get("stale", False)),
        "stale_since": _str(base.get("stale_since")) or None,
        "depleted": bool(base.get("depleted", False)),
        "depleted_since": _str(base.get("depleted_since")) or None,
        "assigned_at": _str(base.get("assigned_at")) or utcnow_iso(),
        "weighed_at": _str(base.get("weighed_at")) or None,
    }


def default_data() -> dict[str, Any]:
    """Return the seed data used on first setup."""
    return {
        "manufacturers": [
            normalize_manufacturer({**entry, "sort_order": index})
            for index, entry in enumerate(DEFAULT_MANUFACTURERS)
        ],
        "materials": [
            normalize_material({**entry, "sort_order": index})
            for index, entry in enumerate(DEFAULT_MATERIALS)
        ],
        "spool_types": [],
        "items": [],
        "assignments": [],
    }
