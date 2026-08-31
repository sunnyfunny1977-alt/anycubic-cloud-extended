"""Repair issues raised by this integration."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN
from .filament.const import LEGACY_DOMAIN

ISSUE_LEGACY_FILAMENT = "legacy_filament_manager_present"


async def async_check_legacy_integrations(hass: HomeAssistant) -> None:
    """Warn when the standalone Filament Manager is still installed.

    Its inventory has just been copied over. If both stay loaded they write to
    two separate storage files from two separate panels, and the stock counts
    drift apart without anything obviously breaking.
    """
    if not hass.config_entries.async_entries(LEGACY_DOMAIN):
        return

    ir.async_create_issue(
        hass,
        DOMAIN,
        ISSUE_LEGACY_FILAMENT,
        is_fixable=False,
        severity=ir.IssueSeverity.WARNING,
        translation_key=ISSUE_LEGACY_FILAMENT,
        translation_placeholders={"legacy_domain": LEGACY_DOMAIN},
    )
