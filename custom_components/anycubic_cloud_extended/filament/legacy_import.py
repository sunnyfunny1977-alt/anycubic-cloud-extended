"""One-shot import of data from the two standalone predecessor integrations.

``anycubic_cloud_extended`` replaces ``anycubic_ha_integration`` (printers) and
``filament_manager`` (inventory). Both wrote their own ``.storage`` files. When
this integration starts for the first time its own files do not exist yet, so
the old ones are read once and their content is adopted.

Nothing is ever deleted or written back: the old integrations keep working if
the user has not removed them yet, and a failed migration can always be
retried by deleting the new storage file.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from ..const import (
    LEGACY_STORAGE_KEY,
    LEGACY_STORAGE_KEY_ACE_STATE,
    LOGGER,
    STORAGE_KEY_FILAMENT_BACKUP,
    STORAGE_VERSION,
)
from .const import LEGACY_STORAGE_KEY as LEGACY_FILAMENT_KEY, LEGACY_STORAGE_VERSION as LEGACY_FILAMENT_VERSION


async def async_import_legacy_filament(hass: HomeAssistant) -> dict[str, Any] | None:
    """Return the inventory of the standalone filament_manager, or None.

    The legacy store class is instantiated with the *old* version number so
    that ``FilamentManagerStore._async_migrate_func`` runs the v1->v2 and
    v2->v3 steps on the way in. Data from any past release therefore arrives
    in the shape the current model expects.
    """
    # Imported here to avoid a circular import: store.py imports this module.
    from .store import FilamentManagerStore

    legacy = FilamentManagerStore(hass, LEGACY_FILAMENT_VERSION, LEGACY_FILAMENT_KEY)
    try:
        data = await legacy.async_load()
    except Exception:  # noqa: BLE001 - never let a broken old file block setup
        LOGGER.exception(
            "Could not read the legacy '%s' storage; starting with an empty inventory",
            LEGACY_FILAMENT_KEY,
        )
        return None

    if not data:
        return None

    LOGGER.info(
        "Importing filament inventory from the legacy '%s' integration: "
        "%d items, %d spool types, %d materials, %d manufacturers",
        LEGACY_FILAMENT_KEY,
        len(data.get("items", [])),
        len(data.get("spool_types", [])),
        len(data.get("materials", [])),
        len(data.get("manufacturers", [])),
    )

    # Keep an untouched copy of exactly what was read, once. If the migration
    # below ever mangles something the user still has the original.
    backup: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY_FILAMENT_BACKUP)
    try:
        if await backup.async_load() is None:
            await backup.async_save({"source": LEGACY_FILAMENT_KEY, "data": data})
    except Exception:  # noqa: BLE001 - a missing backup must not block the import
        LOGGER.warning("Could not write the legacy filament backup", exc_info=True)

    return data


async def async_import_legacy_anycubic(hass: HomeAssistant, key: str) -> dict | None:
    """Return the content of a legacy anycubic_ha_integration store, or None.

    Used for both the auth store and the ACE state store. The ACE state is the
    one that matters: without it the integration does not know which slot each
    box last fed until the next filament change happens.
    """
    legacy_key = {
        "auth": LEGACY_STORAGE_KEY,
        "ace_state": LEGACY_STORAGE_KEY_ACE_STATE,
    }.get(key)
    if legacy_key is None:
        return None

    store: Store[dict] = Store(hass, STORAGE_VERSION, legacy_key)
    try:
        data = await store.async_load()
    except Exception:  # noqa: BLE001
        LOGGER.warning("Could not read the legacy '%s' storage", legacy_key, exc_info=True)
        return None

    if data:
        LOGGER.info("Imported '%s' from the legacy anycubic_ha_integration storage", key)
    return data or None
