"""Persistence and CRUD for the Filament Manager."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from ..const import STORAGE_KEY_FILAMENT, STORAGE_VERSION_FILAMENT
from .const import (
    ERR_IN_USE,
    ERR_INVALID,
    ERR_NO_EMPTY_WEIGHT,
    ERR_NO_SEALED_SPOOLS,
    ERR_NOT_FOUND,
    SIGNAL_UPDATED,
)
from .legacy_import import async_import_legacy_filament
from .models import (
    Item,
    SlotAssignment,
    Manufacturer,
    Material,
    OpenSpool,
    SpoolType,
    default_data,
    item_total_grams,
    item_total_spools,
    net_from_gross,
    assignment_key,
    normalize_assignment,
    normalize_item,
    normalize_manufacturer,
    normalize_material,
    normalize_open_spool,
    normalize_spool_type,
    spool_remaining_grams,
    spool_remaining_percent,
    spool_type_key,
    utcnow_iso,
)

_LOGGER = logging.getLogger(__name__)

SAVE_DELAY = 2


def _text(value: Any) -> str:
    """Coerce a value into a stripped string."""
    return "" if value is None else str(value).strip()


def migrate_v1_to_v2(old_data: dict[str, Any]) -> dict[str, Any]:
    """Move the empty-spool weight from the items into the new spool types.

    Before version 2 every item carried its own tare, which meant the same
    value had to be typed in once per colour. It now lives on the spool type
    (manufacturer + material + size), so one entry covers every colour.
    """
    items = [dict(entry) for entry in old_data.get("items", []) if isinstance(entry, dict)]
    spool_types: list[dict[str, Any]] = []
    by_key: dict[tuple, dict[str, Any]] = {}

    for item in items:
        key = spool_type_key(
            item.get("manufacturer_id"),
            item.get("material_id"),
            item.get("spool_net_weight_g"),
        )
        record = by_key.get(key)
        if record is None:
            record = normalize_spool_type(
                {
                    "manufacturer_id": item.get("manufacturer_id"),
                    "material_id": item.get("material_id"),
                    "net_weight_g": item.get("spool_net_weight_g"),
                    "empty_weight_g": None,
                }
            )
            by_key[key] = record
            spool_types.append(record)

        tare = item.pop("spool_empty_weight_g", None)
        if tare is not None:
            if record["empty_weight_g"] is None:
                record["empty_weight_g"] = float(tare)
            elif float(tare) != record["empty_weight_g"]:
                _LOGGER.warning(
                    "Spool type %s had conflicting empty weights (%s and %s), keeping %s",
                    key,
                    record["empty_weight_g"],
                    tare,
                    record["empty_weight_g"],
                )

        for spool in item.get("open_spools", []):
            if isinstance(spool, dict):
                # Nothing was weighed before version 2, so no reading to carry over.
                spool.setdefault("gross_weight_g", None)

    return {
        "manufacturers": old_data.get("manufacturers", []),
        "materials": old_data.get("materials", []),
        "spool_types": spool_types,
        "items": items,
    }


def migrate_v2_to_v3(old_data: dict[str, Any]) -> dict[str, Any]:
    """Turn the stored percentage into grams.

    Up to version 2 an opened spool could carry a percentage, a gram value or
    both, and the two were allowed to disagree. The gram value is now the only
    stored amount and the percentage is derived from it, so a percentage
    without grams is converted using the size of the spool. Where both were
    present the grams win: they came from a scale, the percentage was a guess.
    """
    for item in old_data.get("items", []):
        if not isinstance(item, dict):
            continue
        net = float(item.get("spool_net_weight_g") or 0)
        for spool in item.get("open_spools", []):
            if not isinstance(spool, dict):
                continue
            percent = spool.pop("remaining_percent", None)
            if spool.get("remaining_grams") is None and percent is not None and net > 0:
                spool["remaining_grams"] = round(float(percent) * net / 100, 1)
    return old_data


def migrate_v3_to_v4(old_data: dict[str, Any]) -> dict[str, Any]:
    """Add the slot bindings and the optional ACE material mapping.

    Purely additive: every existing record keeps its values, materials just
    gain ``ace_material_type = None``, which means "derive it from the name".
    """
    old_data.setdefault("assignments", [])
    for material in old_data.get("materials", []):
        if isinstance(material, dict):
            material.setdefault("ace_material_type", None)
    return old_data


class FilamentManagerStore(Store[dict[str, Any]]):
    """Storage helper that knows how to bring older data forward."""

    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Migrate stored data to the current version."""
        if old_major_version < 2:
            old_data = migrate_v1_to_v2(old_data)
        if old_major_version < 3:
            old_data = migrate_v2_to_v3(old_data)
        if old_major_version < 4:
            old_data = migrate_v3_to_v4(old_data)
        return old_data


class FilamentError(Exception):
    """Raised when a store operation cannot be carried out.

    ``code`` is a stable identifier the frontend translates into a readable
    message; ``details`` carries extra context such as how many items still use
    a record that was about to be deleted.
    """

    def __init__(self, code: str, **details: Any) -> None:
        """Initialise the error."""
        super().__init__(code)
        self.code = code
        self.details = details


class FilamentStore:
    """Holds the inventory in memory and persists it to .storage."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialise the store."""
        self.hass = hass
        self._store: Store[dict[str, Any]] = FilamentManagerStore(
            hass, STORAGE_VERSION_FILAMENT, STORAGE_KEY_FILAMENT
        )
        self._data: dict[str, Any] = {
            "manufacturers": [],
            "materials": [],
            "spool_types": [],
            "items": [],
            "assignments": [],
        }
        self.imported_from_legacy = False

    # ------------------------------------------------------------------
    # Loading and saving
    # ------------------------------------------------------------------

    async def async_load(self) -> None:
        """Load the data, seeding defaults on first run."""
        stored = await self._store.async_load()

        if stored is None:
            # First start after the merge. Adopt the inventory of the
            # standalone filament_manager before seeding anything, otherwise an
            # empty default set would be written immediately and the old data
            # could never be picked up again.
            stored = await async_import_legacy_filament(self.hass)
            self.imported_from_legacy = stored is not None
            if stored is not None:
                stored = migrate_v3_to_v4(stored)

        if stored is None:
            _LOGGER.debug("No stored data found, seeding defaults")
            self._data = default_data()
            await self._store.async_save(self._data)
            return

        self._data = {
            "manufacturers": [
                normalize_manufacturer(entry)
                for entry in stored.get("manufacturers", [])
                if isinstance(entry, dict)
            ],
            "materials": [
                normalize_material(entry)
                for entry in stored.get("materials", [])
                if isinstance(entry, dict)
            ],
            "spool_types": [
                normalize_spool_type(entry)
                for entry in stored.get("spool_types", [])
                if isinstance(entry, dict)
            ],
            "items": [
                normalize_item(entry)
                for entry in stored.get("items", [])
                if isinstance(entry, dict)
            ],
            "assignments": [
                normalize_assignment(entry)
                for entry in stored.get("assignments", [])
                if isinstance(entry, dict)
            ],
        }
        self._backfill_spool_types()
        self._prune_assignments()
        if self.imported_from_legacy:
            await self._store.async_save(self._data)

    @callback
    def _save_and_notify(self) -> None:
        """Schedule a save and tell sensors and the panel about the change."""
        self._store.async_delay_save(lambda: self._data, SAVE_DELAY)
        async_dispatcher_send(self.hass, SIGNAL_UPDATED)

    async def async_remove(self) -> None:
        """Delete the stored data (used when the integration is removed)."""
        await self._store.async_remove()

    # ------------------------------------------------------------------
    # Read access
    # ------------------------------------------------------------------

    @property
    def manufacturers(self) -> list[Manufacturer]:
        """Return all manufacturers sorted for display."""
        return sorted(
            self._data["manufacturers"],
            key=lambda entry: (entry.get("sort_order", 0), entry.get("name", "").lower()),
        )

    @property
    def materials(self) -> list[Material]:
        """Return all materials sorted for display."""
        return sorted(
            self._data["materials"],
            key=lambda entry: (entry.get("sort_order", 0), entry.get("name", "").lower()),
        )

    @property
    def items(self) -> list[Item]:
        """Return all inventory items."""
        return list(self._data["items"])

    def _find(self, collection: str, record_id: str) -> dict[str, Any]:
        """Return one record or raise if it does not exist."""
        for entry in self._data[collection]:
            if entry.get("id") == record_id:
                return entry
        raise FilamentError(ERR_NOT_FOUND, collection=collection, id=record_id)

    def _usage_count(self, field: str, record_id: str) -> int:
        """Return how many items reference a manufacturer or material."""
        return sum(1 for item in self._data["items"] if item.get(field) == record_id)

    # ------------------------------------------------------------------
    # Manufacturers
    # ------------------------------------------------------------------

    def add_manufacturer(self, raw: dict[str, Any]) -> Manufacturer:
        """Create a manufacturer."""
        record = normalize_manufacturer({**raw, "id": None})
        if not record["name"]:
            raise FilamentError(ERR_INVALID, field="name")
        self._data["manufacturers"].append(record)
        self._save_and_notify()
        return record

    def update_manufacturer(self, record_id: str, raw: dict[str, Any]) -> Manufacturer:
        """Update a manufacturer."""
        existing = self._find("manufacturers", record_id)
        record = normalize_manufacturer({**raw, "id": record_id}, existing)
        if not record["name"]:
            raise FilamentError(ERR_INVALID, field="name")
        existing.update(record)
        self._save_and_notify()
        return existing

    def delete_manufacturer(self, record_id: str) -> None:
        """Delete a manufacturer that is not referenced by any item."""
        self._find("manufacturers", record_id)
        if used := self._usage_count("manufacturer_id", record_id):
            raise FilamentError(ERR_IN_USE, count=used)
        self._data["manufacturers"] = [
            entry for entry in self._data["manufacturers"] if entry["id"] != record_id
        ]
        self._save_and_notify()

    # ------------------------------------------------------------------
    # Materials
    # ------------------------------------------------------------------

    def add_material(self, raw: dict[str, Any]) -> Material:
        """Create a material."""
        record = normalize_material({**raw, "id": None})
        if not record["name"]:
            raise FilamentError(ERR_INVALID, field="name")
        self._data["materials"].append(record)
        self._save_and_notify()
        return record

    def update_material(self, record_id: str, raw: dict[str, Any]) -> Material:
        """Update a material."""
        existing = self._find("materials", record_id)
        record = normalize_material({**raw, "id": record_id}, existing)
        if not record["name"]:
            raise FilamentError(ERR_INVALID, field="name")
        existing.update(record)
        self._save_and_notify()
        return existing

    def delete_material(self, record_id: str) -> None:
        """Delete a material that is not referenced by any item."""
        self._find("materials", record_id)
        if used := self._usage_count("material_id", record_id):
            raise FilamentError(ERR_IN_USE, count=used)
        self._data["materials"] = [
            entry for entry in self._data["materials"] if entry["id"] != record_id
        ]
        self._save_and_notify()

    # ------------------------------------------------------------------
    # Spool types (the bare spool behind a group of items)
    # ------------------------------------------------------------------

    @property
    def spool_types(self) -> list[SpoolType]:
        """Return all spool types sorted for display."""
        manufacturers = {e["id"]: e["name"] for e in self._data["manufacturers"]}
        materials = {e["id"]: e["name"] for e in self._data["materials"]}
        return sorted(
            self._data["spool_types"],
            key=lambda entry: (
                manufacturers.get(entry["manufacturer_id"], "").lower(),
                materials.get(entry["material_id"], "").lower(),
                entry.get("net_weight_g", 0),
            ),
        )

    @staticmethod
    def _key_of(record: dict[str, Any], net_field: str) -> tuple:
        """Return the spool-type key of an item or a spool type."""
        return spool_type_key(
            record.get("manufacturer_id"),
            record.get("material_id"),
            record.get(net_field),
        )

    def _find_spool_type(self, key: tuple) -> SpoolType | None:
        """Return the spool type for a business key, if it exists."""
        for entry in self._data["spool_types"]:
            if self._key_of(entry, "net_weight_g") == key:
                return entry
        return None

    def spool_type_for(self, item: Item) -> SpoolType | None:
        """Return the spool type an item belongs to."""
        return self._find_spool_type(self._key_of(item, "spool_net_weight_g"))

    def item_tare(self, item: Item) -> float | None:
        """Return the empty-spool weight that applies to an item."""
        spool_type = self.spool_type_for(item)
        return None if spool_type is None else spool_type.get("empty_weight_g")

    def _ensure_spool_type(self, item: Item) -> SpoolType:
        """Create the spool type of an item if this combination is new."""
        key = self._key_of(item, "spool_net_weight_g")
        existing = self._find_spool_type(key)
        if existing is not None:
            return existing
        record = normalize_spool_type(
            {
                "manufacturer_id": item["manufacturer_id"],
                "material_id": item["material_id"],
                "net_weight_g": item["spool_net_weight_g"],
                "empty_weight_g": None,
            }
        )
        self._data["spool_types"].append(record)
        return record

    def _backfill_spool_types(self) -> None:
        """Make sure every stored combination has a spool type."""
        for item in self._data["items"]:
            self._ensure_spool_type(item)

    def _spool_type_usage(self, spool_type: SpoolType) -> int:
        """Return how many items belong to a spool type."""
        key = self._key_of(spool_type, "net_weight_g")
        return sum(
            1
            for item in self._data["items"]
            if self._key_of(item, "spool_net_weight_g") == key
        )

    def update_spool_type(self, record_id: str, raw: dict[str, Any]) -> SpoolType:
        """Set the empty-spool weight and pull weighed spools along.

        Spool types are created automatically from the items and are never
        removed: a combination whose last item is gone keeps its weight, so
        buying that filament again does not mean measuring the spool again.

        Every opened spool that was actually weighed keeps its reading, so the
        remaining amount is recomputed against the corrected tare. Amounts that
        were typed in by hand carry no reading and stay untouched.
        """
        existing = self._find("spool_types", record_id)
        record = normalize_spool_type({**raw, "id": record_id}, existing)
        existing.update(record)
        self._recompute_weighed_spools(existing)
        self._save_and_notify()
        return existing

    def _recompute_weighed_spools(self, spool_type: SpoolType) -> None:
        """Recompute the remaining grams of every weighed spool of a type."""
        tare = spool_type.get("empty_weight_g")
        if tare is None:
            return
        key = self._key_of(spool_type, "net_weight_g")
        for item in self._data["items"]:
            if self._key_of(item, "spool_net_weight_g") != key:
                continue
            touched = False
            for spool in item.get("open_spools", []):
                gross = spool.get("gross_weight_g")
                if gross is None:
                    continue
                spool["remaining_grams"] = net_from_gross(float(gross), float(tare))
                touched = True
            if touched:
                item["updated_at"] = utcnow_iso()

    # ------------------------------------------------------------------
    # Items
    # ------------------------------------------------------------------

    def add_item(self, raw: dict[str, Any]) -> Item:
        """Create an inventory item."""
        record = normalize_item({**raw, "id": None})
        self._validate_references(record)
        self._ensure_spool_type(record)
        self._data["items"].append(record)
        self._save_and_notify()
        return record

    def update_item(self, record_id: str, raw: dict[str, Any]) -> Item:
        """Update an inventory item.

        The opened spools are managed through their own commands, so they are
        never overwritten here.
        """
        existing = self._find("items", record_id)
        payload = {key: value for key, value in raw.items() if key != "open_spools"}
        record = normalize_item({**payload, "id": record_id}, existing)
        self._validate_references(record)
        self._ensure_spool_type(record)
        existing.update(record)
        self._save_and_notify()
        return existing

    def delete_item(self, record_id: str) -> None:
        """Delete an inventory item."""
        self._find("items", record_id)
        self._data["items"] = [
            entry for entry in self._data["items"] if entry["id"] != record_id
        ]
        self._prune_assignments()
        self._save_and_notify()

    def _validate_references(self, item: Item) -> None:
        """Make sure the referenced manufacturer and material exist."""
        self._find("manufacturers", item["manufacturer_id"])
        self._find("materials", item["material_id"])

    def set_sealed_count(self, record_id: str, count: int) -> Item:
        """Set the number of sealed spools of an item."""
        existing = self._find("items", record_id)
        existing["sealed_count"] = max(0, int(count))
        existing["updated_at"] = utcnow_iso()
        self._save_and_notify()
        return existing

    # ------------------------------------------------------------------
    # Opened spools
    # ------------------------------------------------------------------

    def open_spool(self, item_id: str, raw: dict[str, Any] | None = None) -> OpenSpool:
        """Turn one sealed spool into an opened one."""
        existing = self._find("items", item_id)
        if int(existing.get("sealed_count", 0)) < 1:
            raise FilamentError(ERR_NO_SEALED_SPOOLS)
        existing["sealed_count"] = int(existing["sealed_count"]) - 1
        payload = self._apply_gross_weight(existing, dict(raw or {}))
        # A freshly opened spool is full unless the caller already weighed it.
        full = {"remaining_grams": existing.get("spool_net_weight_g")}
        spool = normalize_open_spool({**full, **payload, "id": None})
        existing["open_spools"].append(spool)
        existing["updated_at"] = utcnow_iso()
        self._save_and_notify()
        return spool

    def update_open_spool(
        self, item_id: str, spool_id: str, raw: dict[str, Any]
    ) -> OpenSpool:
        """Update the remaining amount or note of an opened spool.

        ``gross_weight_g`` is an input aid rather than a stored field: put the
        spool on a scale, send what it reads, and the empty-spool weight of the
        item is subtracted to get the remaining filament.
        """
        existing = self._find("items", item_id)
        payload = self._apply_gross_weight(existing, raw)
        for spool in existing["open_spools"]:
            if spool.get("id") == spool_id:
                spool.update(normalize_open_spool({**payload, "id": spool_id}, spool))
                existing["updated_at"] = utcnow_iso()
                self._save_and_notify()
                return spool
        raise FilamentError(ERR_NOT_FOUND, collection="open_spools", id=spool_id)

    def _apply_gross_weight(self, item: Item, raw: dict[str, Any]) -> dict[str, Any]:
        """Resolve a weighed reading against the tare of the item's spool type.

        The reading is kept so a later correction of the empty-spool weight can
        recompute the remaining amount. Typing a remaining amount by hand drops
        the reading again, because that number no longer came from a scale.
        """
        payload = dict(raw)
        gross = payload.get("gross_weight_g")

        if gross in (None, ""):
            if "remaining_grams" in payload:
                payload["gross_weight_g"] = None
            else:
                payload.pop("gross_weight_g", None)
            return payload

        tare = self.item_tare(item)
        if tare is None:
            raise FilamentError(ERR_NO_EMPTY_WEIGHT, item_id=item["id"])

        payload["gross_weight_g"] = float(gross)
        payload["remaining_grams"] = net_from_gross(float(gross), float(tare))
        return payload

    def consume_spool(self, item_id: str, spool_id: str) -> None:
        """Remove an opened spool that has been used up."""
        existing = self._find("items", item_id)
        remaining = [
            spool for spool in existing["open_spools"] if spool.get("id") != spool_id
        ]
        if len(remaining) == len(existing["open_spools"]):
            raise FilamentError(ERR_NOT_FOUND, collection="open_spools", id=spool_id)
        existing["open_spools"] = remaining
        existing["updated_at"] = utcnow_iso()
        self._prune_assignments()
        self._save_and_notify()

    # ------------------------------------------------------------------
    # Slot assignments (which spool sits in which ACE slot)
    # ------------------------------------------------------------------

    @property
    def assignments(self) -> list[SlotAssignment]:
        """Return all slot bindings."""
        return list(self._data["assignments"])

    def find_assignment(
        self, printer_id: Any, box_id: Any, local_slot: Any
    ) -> SlotAssignment | None:
        """Return the binding of one slot, if there is one."""
        key = assignment_key(printer_id, box_id, local_slot)
        for entry in self._data["assignments"]:
            entry_key = assignment_key(
                entry["printer_id"], entry["box_id"], entry["local_slot"]
            )
            if entry_key == key:
                return entry
        return None

    def set_assignment(self, raw: dict[str, Any]) -> SlotAssignment:
        """Create or replace the binding of one slot.

        There is exactly one binding per (printer_id, box_id, local_slot); a
        second call for the same slot updates the existing record rather than
        adding another one. Leaving out the spool id opens a sealed spool, so
        "put a fresh roll into slot 2" stays a single step for the user.
        """
        item = self._find("items", _text(raw.get("item_id")))
        spool_id = _text(raw.get("spool_id"))

        if not spool_id:
            spool_id = self.open_spool(item["id"])["id"]
        elif not any(s.get("id") == spool_id for s in item.get("open_spools", [])):
            raise FilamentError(ERR_NOT_FOUND, collection="open_spools", id=spool_id)

        existing = self.find_assignment(
            raw.get("printer_id"), raw.get("box_id"), raw.get("local_slot")
        )
        payload = {
            **raw,
            "spool_id": spool_id,
            "needs_weighing": bool(raw.get("needs_weighing", False)),
            "stale": False,
            "stale_since": None,
        }
        if existing is None:
            record = normalize_assignment({**payload, "assigned_at": utcnow_iso()})
            self._data["assignments"].append(record)
        else:
            record = normalize_assignment(payload, existing)
            existing.clear()
            existing.update(record)
            record = existing

        self._save_and_notify()
        return record

    def clear_assignment(self, printer_id: Any, box_id: Any, local_slot: Any) -> None:
        """Remove the binding of one slot."""
        existing = self.find_assignment(printer_id, box_id, local_slot)
        if existing is None:
            raise FilamentError(ERR_NOT_FOUND, collection="assignments")
        self._data["assignments"] = [
            entry
            for entry in self._data["assignments"]
            if entry["id"] != existing["id"]
        ]
        self._save_and_notify()

    def weigh_assignment(
        self,
        printer_id: Any,
        box_id: Any,
        local_slot: Any,
        gross_weight_g: float,
        empty_weight_g: float | None = None,
    ) -> SlotAssignment:
        """Book a scale reading against the spool bound to a slot.

        An empty-spool weight, when supplied, is stored on the spool type
        first. That also recomputes every other roll of the same type that was
        already weighed. Without a tare the update raises ERR_NO_EMPTY_WEIGHT,
        which the frontend uses as its cue to ask for one.
        """
        existing = self.find_assignment(printer_id, box_id, local_slot)
        if existing is None:
            raise FilamentError(ERR_NOT_FOUND, collection="assignments")

        item = self._find("items", existing["item_id"])
        if empty_weight_g is not None:
            spool_type = self._ensure_spool_type(item)
            self.update_spool_type(
                spool_type["id"], {"empty_weight_g": empty_weight_g}
            )

        self.update_open_spool(
            existing["item_id"],
            existing["spool_id"],
            {"gross_weight_g": gross_weight_g},
        )

        existing["needs_weighing"] = False
        existing["stale"] = False
        existing["stale_since"] = None
        existing["weighed_at"] = utcnow_iso()
        self._save_and_notify()
        return existing

    def apply_slot_state(self, changes: list[dict[str, Any]]) -> bool:
        """Apply reconciliation results from the coordinator in one go.

        The coordinator runs on every poll, so writing per slot would push a
        full snapshot to every open panel every 15 seconds. Everything that
        actually changed in one cycle is therefore collected and written once,
        and a cycle that changed nothing writes nothing at all.
        """
        if not changes:
            return False

        touched = False
        for change in changes:
            existing = self.find_assignment(
                change.get("printer_id"),
                change.get("box_id"),
                change.get("local_slot"),
            )
            if existing is None:
                continue
            for key, value in change.items():
                if key in ("printer_id", "box_id", "local_slot"):
                    continue
                if existing.get(key) != value:
                    existing[key] = value
                    touched = True

        if touched:
            self._save_and_notify()
        return touched

    def assignment_detail(self, assignment: SlotAssignment) -> dict[str, Any] | None:
        """Return the display data for a binding, or None if it dangles."""
        item = next(
            (e for e in self._data["items"] if e["id"] == assignment["item_id"]),
            None,
        )
        if item is None:
            return None
        spool = next(
            (
                s
                for s in item.get("open_spools", [])
                if s.get("id") == assignment["spool_id"]
            ),
            None,
        )
        if spool is None:
            return None

        net = float(item.get("spool_net_weight_g") or 0)
        return {
            "item_id": item["id"],
            "spool_id": spool["id"],
            "item_label": self.item_label(item),
            "color_hex": item.get("color_hex"),
            "material_id": item.get("material_id"),
            "remaining_grams": spool.get("remaining_grams"),
            "remaining_percent": spool_remaining_percent(spool, net),
            "net_weight_g": net,
            "tare_g": self.item_tare(item),
            "needs_weighing": bool(assignment.get("needs_weighing")),
            "stale": bool(assignment.get("stale")),
            "weighed_at": assignment.get("weighed_at"),
        }

    def item_label(self, item: Item) -> str:
        """Return a human readable one-liner for an item."""
        manufacturer = next(
            (
                e
                for e in self._data["manufacturers"]
                if e["id"] == item.get("manufacturer_id")
            ),
            None,
        )
        material = next(
            (e for e in self._data["materials"] if e["id"] == item.get("material_id")),
            None,
        )
        parts = [
            manufacturer["name"] if manufacturer else "",
            material["name"] if material else "",
            item.get("color_name") or "",
        ]
        return " ".join(part for part in parts if part).strip() or item["id"]

    def pending_weighings(self) -> list[dict[str, Any]]:
        """Return every slot that is waiting to be weighed."""
        pending = []
        for entry in self._data["assignments"]:
            if not entry.get("needs_weighing"):
                continue
            detail = self.assignment_detail(entry)
            pending.append(
                {
                    "printer_id": entry["printer_id"],
                    "box_id": entry["box_id"],
                    "local_slot": entry["local_slot"],
                    "item_label": detail["item_label"] if detail else entry["item_id"],
                    "stale": bool(entry.get("stale")),
                }
            )
        return sorted(
            pending, key=lambda e: (e["printer_id"], e["box_id"], e["local_slot"])
        )

    def _prune_assignments(self) -> None:
        """Drop bindings whose item or spool no longer exists.

        Runs after loading and after every delete, so a consumed spool or a
        hand-edited storage file can never leave a slot pointing at a ghost.
        """
        alive = []
        for entry in self._data.get("assignments", []):
            item = next(
                (e for e in self._data["items"] if e["id"] == entry.get("item_id")),
                None,
            )
            if item is None:
                continue
            spools = item.get("open_spools", [])
            if not any(s.get("id") == entry.get("spool_id") for s in spools):
                continue
            alive.append(entry)

        dropped = len(self._data.get("assignments", [])) - len(alive)
        if dropped:
            _LOGGER.debug("Dropped %d dangling slot assignment(s)", dropped)
        self._data["assignments"] = alive

    # ------------------------------------------------------------------
    # Snapshot for the panel
    # ------------------------------------------------------------------

    def snapshot(self) -> dict[str, Any]:
        """Return the full state the panel renders from.

        Items are sent with their tare already resolved, so the panel never has
        to rebuild the spool-type key itself and cannot disagree with the
        backend about which spool type an item belongs to.
        """
        return {
            "manufacturers": self.manufacturers,
            "materials": self.materials,
            "spool_types": self.spool_types,
            "items": [self._item_for_panel(item) for item in self.items],
            "assignments": [
                {**entry, "detail": self.assignment_detail(entry)}
                for entry in self._data["assignments"]
            ],
            "usage": {
                "manufacturers": {
                    entry["id"]: self._usage_count("manufacturer_id", entry["id"])
                    for entry in self._data["manufacturers"]
                },
                "materials": {
                    entry["id"]: self._usage_count("material_id", entry["id"])
                    for entry in self._data["materials"]
                },
                "spool_types": {
                    entry["id"]: self._spool_type_usage(entry)
                    for entry in self._data["spool_types"]
                },
            },
            "summary": self.summary(),
        }

    def _item_for_panel(self, item: Item) -> dict[str, Any]:
        """Enrich an item with the values the panel would otherwise recompute.

        The tare and the fill percentage are both derived, and deriving them
        here keeps the backend the single source of truth for them.
        """
        net = float(item.get("spool_net_weight_g") or 0)
        return {
            **item,
            "tare_g": self.item_tare(item),
            "open_spools": [
                {**spool, "remaining_percent": spool_remaining_percent(spool, net)}
                for spool in item.get("open_spools", [])
            ],
        }

    def summary(self) -> dict[str, Any]:
        """Return the aggregated numbers used by the panel and the sensors."""
        items = self._data["items"]
        material_names = {entry["id"]: entry["name"] for entry in self._data["materials"]}
        manufacturer_names = {
            entry["id"]: entry["name"] for entry in self._data["manufacturers"]
        }

        sealed = sum(int(item.get("sealed_count", 0)) for item in items)
        opened = sum(len(item.get("open_spools", [])) for item in items)
        total_grams = sum(item_total_grams(item) for item in items)

        by_material: dict[str, int] = {}
        by_manufacturer: dict[str, int] = {}
        value = 0.0
        for item in items:
            spools = item_total_spools(item)
            material = material_names.get(item.get("material_id"), "?")
            manufacturer = manufacturer_names.get(item.get("manufacturer_id"), "?")
            by_material[material] = by_material.get(material, 0) + spools
            by_manufacturer[manufacturer] = by_manufacturer.get(manufacturer, 0) + spools
            if item.get("price") is not None:
                value += float(item["price"]) * spools

        return {
            "entry_count": len(items),
            "sealed_spools": sealed,
            "open_spools": opened,
            "total_spools": sealed + opened,
            "total_grams": round(total_grams, 1),
            "total_kg": round(total_grams / 1000, 3),
            "inventory_value": round(value, 2),
            "by_material": dict(sorted(by_material.items())),
            "by_manufacturer": dict(sorted(by_manufacturer.items())),
        }

    def low_stock_items(self, threshold: int) -> list[dict[str, Any]]:
        """Return items at or below the low-stock threshold, most urgent first."""
        material_names = {entry["id"]: entry["name"] for entry in self._data["materials"]}
        manufacturer_names = {
            entry["id"]: entry["name"] for entry in self._data["manufacturers"]
        }

        low: list[dict[str, Any]] = []
        for item in self._data["items"]:
            spools = item_total_spools(item)
            if spools > threshold:
                continue
            net = float(item.get("spool_net_weight_g") or 0)
            low.append(
                {
                    "id": item["id"],
                    "name": " ".join(
                        part
                        for part in (
                            manufacturer_names.get(item.get("manufacturer_id"), ""),
                            material_names.get(item.get("material_id"), ""),
                            item.get("color_name", ""),
                        )
                        if part
                    ),
                    "spools": spools,
                    "grams": round(
                        sum(
                            spool_remaining_grams(spool, net)
                            for spool in item.get("open_spools", [])
                        )
                        + int(item.get("sealed_count", 0)) * net,
                        1,
                    ),
                }
            )
        return sorted(low, key=lambda entry: (entry["spools"], entry["grams"]))
