"""The anycubic_cloud_extended component.

Merges two integrations that used to live side by side: the Anycubic Cloud
connection (printers, ACE boxes, panel and card) and the Filament Manager
(inventory of spools). They are one integration now so a slot in the ACE can
point at a specific roll in the cupboard.

The printer half is per config entry — one entry per cloud account. The
inventory is not: there is one filament cupboard no matter how many accounts
are set up. It is therefore loaded once by whichever entry comes first and
released when the last one goes away.
"""
from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    CONF_CARD_CONFIG,
    COORDINATOR,
    DATA_FILAMENT_STORE,
    DATA_WEBSOCKET_REGISTERED,
    DOMAIN,
    LOGGER,
    PLATFORMS,
)
from .coordinator import AnycubicCloudDataUpdateCoordinator
from .filament.services import FILAMENT_SERVICES
from .filament.store import FilamentStore
from .helpers import entry_ids_in_data
from .panel import (
    async_register_card_resource,
    async_register_panel,
    async_unregister_panel,
)
from .repairs import async_check_legacy_integrations
from .services import SERVICES
from .websocket_api import async_register_websocket_api


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Anycubic Cloud Extended from a config entry."""

    domain_data = hass.data.setdefault(DOMAIN, {})

    # The inventory has to exist before the first coordinator refresh: that
    # refresh already reconciles the slot bindings.
    if DATA_FILAMENT_STORE not in domain_data:
        store = FilamentStore(hass)
        await store.async_load()
        domain_data[DATA_FILAMENT_STORE] = store

    # Checked on every setup rather than only after an import: a predecessor
    # integration that is still configured keeps causing problems for as long
    # as it exists, and the check clears its own issues once it is gone.
    await async_check_legacy_integrations(hass)

    if not domain_data.get(DATA_WEBSOCKET_REGISTERED):
        async_register_websocket_api(hass)
        domain_data[DATA_WEBSOCKET_REGISTERED] = True

    coordinator = AnycubicCloudDataUpdateCoordinator(hass, entry)
    await coordinator.async_config_entry_first_refresh()

    domain_data[entry.entry_id] = {
        COORDINATOR: coordinator,
    }

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(update_listener))

    # register service calls
    for service_name, service in SERVICES:
        if not hass.services.has_service(DOMAIN, service_name):
            hass.services.async_register(
                DOMAIN,
                service_name,
                service(hass).async_call_service,
                service.schema,
            )

    for service_name, handler, schema in FILAMENT_SERVICES:
        if not hass.services.has_service(DOMAIN, service_name):
            hass.services.async_register(DOMAIN, service_name, handler(hass), schema)

    # register panel and the Lovelace card resource
    await async_register_panel(
        hass,
        entry.options.get(CONF_CARD_CONFIG)
    )
    await async_register_card_resource(hass)

    return True


async def update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""

    unload_ok = await hass.config_entries.async_unload_platforms(
        entry, PLATFORMS
    )

    if unload_ok and entry.entry_id in hass.data[DOMAIN]:
        host = hass.data[DOMAIN].pop(entry.entry_id)
        await host[COORDINATOR].stop_anycubic_mqtt_connection_if_started()

    # Everything below is shared between entries, so it may only be torn down
    # once the last one is gone. `entry_ids_in_data` skips the singletons that
    # live in the same dict.
    if unload_ok and not entry_ids_in_data(hass):
        for service_name, _ in SERVICES:
            hass.services.async_remove(DOMAIN, service_name)
        for service_name, _, _ in FILAMENT_SERVICES:
            hass.services.async_remove(DOMAIN, service_name)

        async_unregister_panel(hass)

        # The inventory is dropped from memory but never from disk: removing
        # the integration must not throw away the filament cupboard.
        hass.data[DOMAIN].pop(DATA_FILAMENT_STORE, None)
        LOGGER.debug("Last config entry unloaded, released the filament store")

    return unload_ok
