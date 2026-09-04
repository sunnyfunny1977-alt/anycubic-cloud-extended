"""Repair issues raised by this integration."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN
from .filament.const import LEGACY_DOMAIN

ISSUE_LEGACY_FILAMENT = "legacy_filament_manager_present"
ISSUE_LEGACY_ANYCUBIC = "legacy_anycubic_integration_present"

LEGACY_ANYCUBIC_DOMAIN = "anycubic_ha_integration"


async def async_check_legacy_integrations(hass: HomeAssistant) -> None:
    """Flag predecessor integrations that are still set up.

    Called on every setup, not just after an import: both conditions below stay
    harmful for as long as the old integration exists, and both are cleared
    again as soon as it is removed.
    """
    _check_legacy_anycubic(hass)
    _check_legacy_filament(hass)


def _check_legacy_anycubic(hass: HomeAssistant) -> None:
    """Warn that the two printer integrations fight over the cloud session.

    Anycubic's cloud allows one session per account. Both integrations
    authenticate with the same token and each refreshes it independently, so
    whichever refreshes last invalidates the other. The loser fails with a bare
    "Authentication failed. Check credentials.", which reads as a bad token and
    sends people off to fetch a new one — that does not help, because the next
    refresh breaks it again. Only removing one of the two integrations does.
    """
    if not hass.config_entries.async_entries(LEGACY_ANYCUBIC_DOMAIN):
        ir.async_delete_issue(hass, DOMAIN, ISSUE_LEGACY_ANYCUBIC)
        return

    ir.async_create_issue(
        hass,
        DOMAIN,
        ISSUE_LEGACY_ANYCUBIC,
        is_fixable=False,
        severity=ir.IssueSeverity.ERROR,
        translation_key=ISSUE_LEGACY_ANYCUBIC,
        translation_placeholders={"legacy_domain": LEGACY_ANYCUBIC_DOMAIN},
    )


def _check_legacy_filament(hass: HomeAssistant) -> None:
    """Warn that two inventories are being kept in parallel.

    The import copies the inventory once. While the old integration also runs,
    both write to their own storage file from their own panel and the stock
    counts drift apart without anything obviously breaking.
    """
    if not hass.config_entries.async_entries(LEGACY_DOMAIN):
        ir.async_delete_issue(hass, DOMAIN, ISSUE_LEGACY_FILAMENT)
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
