"""Take what the printer eats off the spool that is feeding it.

The printer reports how much filament the running job has used so far. That is
a *cumulative* figure for one job, so the amount to subtract is the difference
since the last look -- which makes the bookkeeping the whole problem:

* A restart mid-print must not subtract the job's total a second time, so the
  figure already accounted for is persisted alongside the job it belongs to.
* A new job restarts the count at zero, so a drop means "different job", not
  "filament came back".
* A multi-material job switches slots as it prints. Each difference goes to
  whichever slot was feeding when it was observed, which is the only
  attribution available and happens to be the right one.

Nothing is subtracted from a slot with no binding: there is no spool to take it
from, and picking one would be worse than leaving the number alone.
"""

from __future__ import annotations

from typing import Any

from ..const import (
    DATA_FILAMENT_STORE,
    DOMAIN,
    FILAMENT_DEDUCT_THRESHOLD_G,
    LOGGER,
)


class ConsumptionTracker:
    """Turns the job's running total into per-spool deductions."""

    def __init__(self, hass: Any) -> None:
        """Initialise the tracker."""
        self.hass = hass
        # printer_id -> {"job": <job key>, "used_g": <already deducted>}
        self._progress: dict[str, dict[str, Any]] = dict()
        self._dirty = False

    @property
    def _store(self) -> Any:
        """Return the filament store, or None when it failed to load."""
        return self.hass.data.get(DOMAIN, {}).get(DATA_FILAMENT_STORE)

    # ------------------------------------------------------------------

    @property
    def progress(self) -> dict[str, dict[str, Any]]:
        """The per-printer bookkeeping, for persisting."""
        return self._progress

    def restore(self, stored: dict[str, Any] | None) -> None:
        """Reload what a previous run had already deducted."""
        if not stored:
            return

        for printer_id, entry in stored.items():
            if not isinstance(entry, dict):
                continue
            self._progress[str(printer_id)] = {
                "job": entry.get("job"),
                "used_g": float(entry.get("used_g") or 0.0),
            }

    def take_dirty(self) -> bool:
        """Report and clear whether anything changed since the last save."""
        dirty = self._dirty
        self._dirty = False
        return dirty

    # ------------------------------------------------------------------

    def apply(
        self,
        printer_id: Any,
        job_key: Any,
        used_g: float | None,
        active_slot: dict[str, Any] | None,
    ) -> None:
        """Book the filament used since the last cycle against the active slot.

        `job_key` identifies the running job; when it changes the count starts
        again from zero. `active_slot` is the spool the box is feeding, and
        carries the `box_id` and `local_slot` the binding is keyed by.
        """
        store = self._store
        if store is None or used_g is None:
            return

        key = str(printer_id)
        previous = self._progress.get(key)

        if previous is None or previous.get("job") != job_key:
            # A job we have not seen. Everything it has used so far is new,
            # even if Home Assistant missed the start of it.
            previous = {"job": job_key, "used_g": 0.0}
            self._progress[key] = previous
            self._dirty = True

        delta = float(used_g) - float(previous["used_g"])

        if delta < 0:
            # The figure went backwards without the job changing -- a re-slice,
            # or the printer resetting its own counter. Re-anchor rather than
            # hand out a negative, which would add filament back.
            LOGGER.debug(
                "Filament used by printer %s fell from %s to %s without a new "
                "job; re-anchoring instead of crediting the spool",
                printer_id,
                previous["used_g"],
                used_g,
            )
            previous["used_g"] = float(used_g)
            self._dirty = True
            return

        if delta < FILAMENT_DEDUCT_THRESHOLD_G:
            return

        if not active_slot:
            # Printing, but nothing is reported as feeding. Hold the figure:
            # once a slot is known again the whole amount is booked then.
            return

        try:
            remaining = store.consume_from_slot(
                key,
                active_slot.get("box_id"),
                active_slot.get("local_slot"),
                delta,
            )
        except Exception:  # noqa: BLE001 - never break the printer update
            LOGGER.exception(
                "Could not deduct %.1f g from printer %s slot %s",
                delta,
                printer_id,
                active_slot.get("local_slot"),
            )
            return

        if remaining is None:
            # No binding on that slot. Nothing to subtract from, so the amount
            # stays on the clock: binding a spool mid-print would otherwise be
            # charged for everything printed before it.
            previous["used_g"] = float(used_g)
            self._dirty = True
            return

        previous["used_g"] = float(used_g)
        self._dirty = True

        LOGGER.debug(
            "Deducted %.1f g from printer %s box %s slot %s, %.1f g left",
            delta,
            printer_id,
            active_slot.get("box_id"),
            active_slot.get("local_slot"),
            remaining,
        )
