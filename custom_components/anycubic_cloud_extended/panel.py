"""Anycubic Cloud frontend panel."""
from __future__ import annotations

import json
import os
from typing import Any

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import (
    CARD_FILENAME,
    CUSTOM_COMPONENTS,
    DATA_CARD_RESOURCE_DONE,
    DOMAIN,
    FILAMENT_PANEL_FILENAME,
    FILAMENT_PANEL_ICON,
    FILAMENT_PANEL_NAME,
    FILAMENT_PANEL_TITLE,
    FILAMENT_PANEL_URL_PATH,
    INTEGRATION_FOLDER,
    LOGGER,
    PANEL_FILENAME,
    PANEL_FOLDER,
    PANEL_ICON,
    PANEL_NAME,
    PANEL_TITLE,
)
from .helpers import extract_panel_card_config

# Base URL of the served `dist` directory; see _async_register_static_path.
PANEL_URL = "/anycubic-cloud-extended-static"
PANEL_MODULE_URL = f"{PANEL_URL}/{PANEL_FILENAME.split('/')[-1]}"
CARD_MODULE_URL = f"{PANEL_URL}/{CARD_FILENAME.split('/')[-1]}"
FILAMENT_PANEL_MODULE_URL = f"{PANEL_URL}/{FILAMENT_PANEL_FILENAME.split('/')[-1]}"


def process_card_config(
    conf_object: Any,
) -> dict[str, Any]:
    if isinstance(conf_object, dict):
        return extract_panel_card_config(conf_object)
    else:
        return {}


def versioned_module_url(root_dir: str, filename: str, module_url: str) -> str:
    """Return a bundle URL that changes whenever the bundle does.

    Without the version in the query a browser keeps serving the old bundle
    from cache after an update, which looks exactly like the update not having
    happened. The file mtime is part of it so a locally rebuilt bundle busts the
    cache as well, even though the manifest version did not move.

    Does blocking I/O -- call it from the executor.
    """
    manifest_path = os.path.join(root_dir, "manifest.json")
    bundle_path = os.path.join(root_dir, PANEL_FOLDER, filename)

    try:
        with open(manifest_path, encoding="utf-8") as manifest_file:
            version = json.load(manifest_file).get("version")
    except (OSError, ValueError):
        version = None

    if not version:
        return module_url

    try:
        bundle_mtime = int(os.path.getmtime(bundle_path))
    except OSError:
        bundle_mtime = 0

    return f"{module_url}?v={version}.{bundle_mtime}"


def get_panel_module_url(root_dir: str) -> str:
    return versioned_module_url(root_dir, PANEL_FILENAME, PANEL_MODULE_URL)


def get_card_module_url(root_dir: str) -> str:
    return versioned_module_url(root_dir, CARD_FILENAME, CARD_MODULE_URL)


def get_filament_panel_module_url(root_dir: str) -> str:
    return versioned_module_url(
        root_dir, FILAMENT_PANEL_FILENAME, FILAMENT_PANEL_MODULE_URL
    )


def _dist_dir(hass: HomeAssistant) -> str:
    """Return the directory the frontend bundles are served from."""
    root_dir = os.path.join(hass.config.path(CUSTOM_COMPONENTS), INTEGRATION_FOLDER)
    return os.path.dirname(os.path.join(root_dir, PANEL_FOLDER, PANEL_FILENAME))


async def _async_register_static_path(hass: HomeAssistant) -> None:
    """Serve the `dist` directory, once, whichever panel asks first.

    The whole directory rather than a single bundle: the card, the standalone
    filament panel and the printer images sit next to the printer panel and have
    to be reachable too.
    """
    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_URL, _dist_dir(hass), cache_headers=False)]
        )
    except RuntimeError as e:
        if "already registered" not in str(e):
            raise e


async def async_register_panel(
    hass: HomeAssistant,
    conf_object: Any,
) -> None:
    """Register the Anycubic Cloud frontend panel."""
    if DOMAIN not in hass.data.get("frontend_panels", {}):
        root_dir = os.path.join(hass.config.path(CUSTOM_COMPONENTS), INTEGRATION_FOLDER)
        module_url = await hass.async_add_executor_job(get_panel_module_url, root_dir)
        await _async_register_static_path(hass)

        conf = process_card_config(conf_object)

        LOGGER.debug(f"Processed panel config: {conf}")

        await panel_custom.async_register_panel(
            hass,
            webcomponent_name=PANEL_NAME,
            frontend_url_path=DOMAIN,
            module_url=module_url,
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            require_admin=False,
            config=conf,
        )


async def async_register_filament_panel(hass: HomeAssistant) -> None:
    """Register the filament inventory as a sidebar panel of its own.

    Stock keeping is not a printer task: it stays useful while every printer is
    offline, it is what somebody opens to weigh a spool, and behind "pick a
    printer, then find the tab" it is effectively buried. The same views still
    run as a tab inside the printer panel, which is where a spool gets tied to
    an ACE slot -- that part does need a printer.

    Not admin-only: weighing a spool is an everyday chore. The views hide their
    own admin tab from non-admin users and the catalogue commands are guarded in
    the backend, so a household member can record a weight without being able
    to rewrite the catalogue.
    """
    if FILAMENT_PANEL_URL_PATH in hass.data.get("frontend_panels", {}):
        return

    root_dir = os.path.join(hass.config.path(CUSTOM_COMPONENTS), INTEGRATION_FOLDER)
    module_url = await hass.async_add_executor_job(
        get_filament_panel_module_url, root_dir
    )
    await _async_register_static_path(hass)

    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=FILAMENT_PANEL_NAME,
        frontend_url_path=FILAMENT_PANEL_URL_PATH,
        module_url=module_url,
        sidebar_title=FILAMENT_PANEL_TITLE,
        sidebar_icon=FILAMENT_PANEL_ICON,
        require_admin=False,
        config={},
    )


def async_unregister_panel(hass: HomeAssistant) -> None:
    """Remove both sidebar entries.

    Called only once the last config entry is gone: the panels are shared
    between entries, so removing them per entry would empty the sidebar while a
    printer is still set up.
    """
    frontend.async_remove_panel(hass, DOMAIN)
    frontend.async_remove_panel(hass, FILAMENT_PANEL_URL_PATH)
    LOGGER.debug("Removing panels")


async def async_register_card_resource(hass: HomeAssistant) -> None:
    """Make the Lovelace card usable without the user adding a resource.

    Putting the card on a dashboard is now part of the normal workflow — it is
    where spools get assigned and weighed — so leaving the resource entry as a
    manual step just produces a card that renders as "custom element not
    found". Registration is best effort: a dashboard problem must never stop
    the integration from loading.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(DATA_CARD_RESOURCE_DONE):
        return

    root_dir = os.path.join(hass.config.path(CUSTOM_COMPONENTS), INTEGRATION_FOLDER)
    url = await hass.async_add_executor_job(get_card_module_url, root_dir)

    try:
        lovelace = hass.data.get("lovelace")
        resources = getattr(lovelace, "resources", None)
        if resources is None:
            LOGGER.info(
                "Lovelace is in YAML mode; add this resource manually to use the "
                "card: url: %s, type: module",
                url,
            )
            domain_data[DATA_CARD_RESOURCE_DONE] = True
            return

        if not resources.loaded:
            await resources.async_load()

        existing = next(
            (
                item
                for item in resources.async_items()
                if CARD_MODULE_URL in str(item.get("url", ""))
            ),
            None,
        )

        if existing is None:
            await resources.async_create_item({"res_type": "module", "url": url})
            LOGGER.info("Registered the Anycubic card as a Lovelace resource")
        elif existing.get("url") != url:
            await resources.async_update_item(existing["id"], {"url": url})
            LOGGER.debug("Updated the Anycubic card resource to %s", url)

        domain_data[DATA_CARD_RESOURCE_DONE] = True
    except Exception:  # noqa: BLE001 - never block setup over a dashboard detail
        LOGGER.warning(
            "Could not register the Anycubic card as a Lovelace resource; add it "
            "manually with url: %s and type: module",
            url,
            exc_info=True,
        )
