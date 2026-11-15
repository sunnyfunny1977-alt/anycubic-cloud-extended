"""Keep the inventory in step with what is physically in the ACE slots.

The printer knows a slot holds "PLA, red". The inventory knows the user owns
an eSun PLA red roll with 640 g left on it. Neither can bridge the gap on its
own, so the user makes the connection once per roll and this module watches
whether it still holds.

Every coordinator cycle the fingerprint of each slot is compared against the
one stored with its binding. A mismatch does not delete the binding — the ACE
briefly reports an empty slot during a feed, and dropping the assignment on
every print start would make the feature useless. The binding is marked as no
longer describing the slot instead, so the panel can say so rather than keep
showing a spool that has been taken out.

Nothing here asks for anything. Whether the new roll gets weighed is the user's
call, and the inventory is none the worse for a roll they chose not to weigh.
"""

from __future__ import annotations

from typing import Any

from ..const import (
    DATA_FILAMENT_STORE,
    DOMAIN,
    ENTITY_ID_ACE_SLOT_,
    ENTITY_ID_ACE_SLOT_SUFFIX_REMAINING,
    LOGGER,
    MAX_ACE_SLOTS,
)
from ..helpers import (
    spool_color_hex,
    spool_fingerprint,
    spool_info_for_local_slot,
)
from .models import utcnow_iso

# Which attribute of the printer dict holds which box, and what entity key
# prefix its slots use. box_id -1 is the Kobra X internal rack / external
# holder, which has no per-slot entities but can still hold a binding.
_BOX_SOURCES: tuple[tuple[str, str, int], ...] = (
    ("ace_spools", "", 0),
    ("secondary_ace_spools", "secondary_", 1),
)


class SlotBindingManager:
    """Reconciles slot bindings against what the printers report."""

    def __init__(self, hass: Any) -> None:
        """Initialise the manager."""
        self.hass = hass

    @property
    def _store(self) -> Any:
        """Return the filament store, or None when it failed to load.

        Looked up lazily on every use: a store that is missing must never turn
        into a setup error for the printer half of the integration.
        """
        return self.hass.data.get(DOMAIN, {}).get(DATA_FILAMENT_STORE)

    def reconcile_and_enrich(self, data_dict: dict[str, Any]) -> None:
        """Compare fingerprints, flag swaps and enrich the printer states.

        Runs inside the coordinator update, so it does both jobs in one pass:
        the states and attributes the entities read are filled in here, and
        everything that changed is written back to the store in a single save
        at the end. A cycle in which nothing changed writes nothing, which
        matters because the coordinator polls every 15 seconds with MQTT on.
        """
        store = self._store
        if store is None:
            return

        changes: list[dict[str, Any]] = []

        for printer_id, printer_data in data_dict.get("printers", {}).items():
            try:
                self._reconcile_printer(store, str(printer_id), printer_data, changes)
            except Exception:  # noqa: BLE001 - never break the printer update
                LOGGER.exception(
                    "Failed to reconcile filament slot bindings for printer %s",
                    printer_id,
                )

        store.apply_slot_state(changes)

    # ------------------------------------------------------------------

    def _reconcile_printer(
        self,
        store: Any,
        printer_id: str,
        printer_data: dict[str, Any],
        changes: list[dict[str, Any]],
    ) -> None:
        """Handle every box of one printer."""
        states = printer_data.setdefault("states", {})
        attributes = printer_data.setdefault("attributes", {})

        for attr_key, prefix, box_id in _BOX_SOURCES:
            spool_info = (attributes.get(attr_key) or {}).get("spool_info")

            for index in range(MAX_ACE_SLOTS):
                local_slot = index + 1
                spool = spool_info_for_local_slot(spool_info, local_slot)
                entity_key = f"{prefix}{ENTITY_ID_ACE_SLOT_}{local_slot}"

                if spool is None:
                    # The slot does not exist on this machine. Leaving the keys
                    # unset is what stops the entities being created at all,
                    # the same mechanic the plain slot sensors use.
                    continue

                detail = self._reconcile_slot(
                    store, printer_id, box_id, local_slot, spool, changes
                )

                # Written straight onto the spool dict as well as the slot
                # sensor: the card renders from `spool_info`, and giving it the
                # printer id here saves threading the printer device down
                # through three levels of component just to identify a slot.
                spool["printer_id"] = printer_id
                spool["assignment"] = detail

                if entity_key in attributes:
                    attributes[entity_key]["assignment"] = detail

                states[entity_key + ENTITY_ID_ACE_SLOT_SUFFIX_REMAINING] = (
                    None if detail is None else detail.get("remaining_grams")
                )
                # `detail` already carries `stale`, `item_label` and
                # `weighed_at`, so the remaining-grams sensor is the one place
                # the whole binding is exposed.
                attributes[entity_key + ENTITY_ID_ACE_SLOT_SUFFIX_REMAINING] = (
                    detail or {}
                )

    def _reconcile_slot(
        self,
        store: Any,
        printer_id: str,
        box_id: int,
        local_slot: int,
        spool: dict[str, Any],
        changes: list[dict[str, Any]],
    ) -> dict[str, Any] | None:
        """Compare one slot against its binding and return the display data."""
        assignment = store.find_assignment(printer_id, box_id, local_slot)
        if assignment is None:
            return None

        detail: dict[str, Any] | None = store.assignment_detail(assignment)
        if detail is None:
            # Pruning happens on load and on delete; a dangling record here
            # means the data changed underneath us, so just hide it.
            return None

        current = spool_fingerprint(spool)
        stored = assignment.get("fingerprint") or ""

        if not stored:
            # Bound without a fingerprint, which a client is not obliged to
            # supply: the panel knows the slot but not how the signature is
            # built, and duplicating that in the frontend would be a second
            # implementation to keep in step. An empty one means nobody ever
            # recorded what was in the slot -- not that the filament changed --
            # so adopt what is there now. Calling it a swap would mark the
            # binding stale a second after it was made, and a stale binding is
            # deliberately never charged for what it prints.
            #
            # An empty slot is not worth recording, though: the ACE reports one
            # during every feed, and adopting that signature would mark the
            # binding stale again as soon as the roll came back. Waiting costs
            # nothing, because an empty slot is not printing either.
            if not spool.get("spool_loaded"):
                detail["stale"] = False
                return detail

            changes.append(
                {
                    "printer_id": printer_id,
                    "box_id": box_id,
                    "local_slot": local_slot,
                    "fingerprint": current,
                    "fp_material_type": str(spool.get("material_type") or ""),
                    "fp_color_hex": spool_color_hex(spool.get("color")) or "",
                    "fp_sku": str(spool.get("sku") or ""),
                    "fp_status": spool.get("status"),
                    "stale": False,
                    "stale_since": None,
                }
            )
            detail["stale"] = False
            return detail

        if current == stored:
            if assignment.get("stale"):
                # The ACE flickers to "empty" while feeding and back again.
                # Coming back to the known fingerprint means the same roll is
                # in there after all, so the mark clears itself.
                changes.append(
                    {
                        "printer_id": printer_id,
                        "box_id": box_id,
                        "local_slot": local_slot,
                        "stale": False,
                        "stale_since": None,
                    }
                )
                detail["stale"] = False
            return detail

        if not assignment.get("stale"):
            changes.append(
                {
                    "printer_id": printer_id,
                    "box_id": box_id,
                    "local_slot": local_slot,
                    "stale": True,
                    "stale_since": utcnow_iso(),
                }
            )
            LOGGER.debug(
                "Filament in printer %s box %s slot %s changed (%s -> %s); "
                "the binding no longer describes the slot",
                printer_id,
                box_id,
                local_slot,
                stored,
                current,
            )

        detail["stale"] = True
        detail["fingerprint_mismatch"] = bool(spool.get("spool_loaded"))
        return detail
