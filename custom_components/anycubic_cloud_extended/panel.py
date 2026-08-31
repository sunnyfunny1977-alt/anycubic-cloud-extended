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
    INTEGRATION_FOLDER,
    LOGGER,
    PANEL_FILENAME,
    PANEL_FOLDER,
    PANEL_ICON,
    PANEL_NAME,
    PANEL_TITLE,
)
from .helpers import extract_panel_card_config

# Serves the whole `dist` directory, not just the panel bundle: the Lovelace
# card and the printer images live next to it and need to be reachable too.
PANEL_URL = "/anycubic-cloud-extended-static"
PANEL_MODULE_URL = f"{PANEL_URL}/{PANEL_FILENAME.split('/')[-1]}"
CARD_MODULE_URL = f"{PANEL_URL}/{CARD_FILENAME.split('/')[-1]}"


def process_card_config(
    conf_object: Any,
) -> dict[str, Any]:
    if isinstance(conf_object, dict):
        return extract_panel_card_config(conf_object)
    else:
        return {}


def get_panel_module_url(root_dir: str) -> str:
    manifest_path = os.path.join(root_dir, "manifest.json")
    panel_path = os.path.join(root_dir, PANEL_FOLDER, PANEL_FILENAME)
    try:
        with open(manifest_path, encoding="utf-8") as manifest_file:
            manifest = json.load(manifest_file)
    except (OSError, ValueError):
        return PANEL_MODULE_URL

    version = manifest.get("version")
    if not version:
        return PANEL_MODULE_URL

    try:
        panel_mtime = int(os.path.getmtime(panel_path))
    except OSError:
        panel_mtime = 0

    return f"{PANEL_MODULE_URL}?v={version}.{panel_mtime}"


def get_card_module_url(root_dir: str) -> str:
    """Return the versioned URL of the Lovelace card bundle.

    Same cache-busting scheme as the panel. Without the version in the query a
    browser keeps serving the card from cache after an update, which looks
    exactly like the update not having happened.
    """
    manifest_path = os.path.join(root_dir, "manifest.json")
    card_path = os.path.join(root_dir, PANEL_FOLDER, CARD_FILENAME)
    try:
        with open(manifest_path, encoding="utf-8") as manifest_file:
            version = json.load(manifest_file).get("version")
    except (OSError, ValueError):
        version = None

    if not version:
        return CARD_MODULE_URL

    try:
        card_mtime = int(os.path.getmtime(card_path))
    except OSError:
        card_mtime = 0

    return f"{CARD_MODULE_URL}?v={version}.{card_mtime}"


async def async_register_panel(
    hass: HomeAssistant,
    conf_object: Any,
) -> None:
    """Register the Anycubic Cloud frontend panel."""
    if DOMAIN not in hass.data.get("frontend_panels", {}):
        root_dir = os.path.join(hass.config.path(CUSTOM_COMPONENTS), INTEGRATION_FOLDER)
        panel_dir = os.path.join(root_dir, PANEL_FOLDER)
        dist_dir = os.path.dirname(os.path.join(panel_dir, PANEL_FILENAME))
        module_url = await hass.async_add_executor_job(get_panel_module_url, root_dir)
        try:
            await hass.http.async_register_static_paths(
                [StaticPathConfig(PANEL_URL, dist_dir, cache_headers=False)]
            )
        except RuntimeError as e:
            if "already registered" not in str(e):
                raise e

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


def async_unregister_panel(hass: HomeAssistant) -> None:
    frontend.async_remove_panel(hass, DOMAIN)
    LOGGER.debug("Removing panel")


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
