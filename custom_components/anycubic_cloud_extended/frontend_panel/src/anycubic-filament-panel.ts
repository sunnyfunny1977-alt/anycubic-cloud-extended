/**
 * Entry point of the standalone Filament Manager panel.
 *
 * Deliberately its own bundle rather than a second element inside
 * `anycubic-cloud-panel.js`: the inventory views are dependency-free, while the
 * printer panel pulls in Lit, date-fns and the Agora video SDK and weighs two
 * megabytes. Someone who only opens the filament cupboard should not have to
 * download the video stack, so this file imports nothing but the views.
 *
 * The same views also run as a tab inside the printer panel
 * (`views/filament/view-filament.ts`). They stay host-agnostic: whoever embeds
 * them owns the URL and answers their `ac-filament-navigate` event.
 */

import type { HassRoute, HomeAssistant } from "./types";

import "./filament_panel/app.js";

const HOST_ELEMENT = "anycubic-filament-manager-panel";
const INVENTORY_ELEMENT = "anycubic-filament-panel";

// Kept in sync with `VIEWS` in filament_panel/app.js. Duplicated rather than
// exported from that module so the URL can be validated before the views have
// been touched.
const VIEWS = ["overview", "admin"];

interface InventoryElement extends HTMLElement {
  hass: HomeAssistant;
  narrow: boolean;
  route: HassRoute | null;
  panel: unknown;
}

/**
 * Wraps the inventory views as a Home Assistant sidebar panel.
 *
 * A plain `HTMLElement`, not a Lit component: its whole job is to forward four
 * properties and to turn the views' navigation event into a URL under its own
 * panel path. Pulling Lit in for that would defeat the point of a small bundle.
 */
class AnycubicFilamentManagerPanel extends HTMLElement {
  private _inventory: InventoryElement;

  private _route: HassRoute | null = null;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });

    // Home Assistant assigns the panel properties before the element is
    // connected, so the child has to exist from the start -- otherwise the
    // first `hass` would be dropped and the views would never initialise.
    this._inventory = document.createElement(
      INVENTORY_ELEMENT,
    ) as InventoryElement;

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        height: 100%;
      }
    `;

    root.append(style, this._inventory);
  }

  set hass(value: HomeAssistant) {
    this._inventory.hass = value;
  }

  set narrow(value: boolean) {
    this._inventory.narrow = Boolean(value);
  }

  set panel(value: unknown) {
    this._inventory.panel = value;
  }

  set route(value: HassRoute) {
    this._route = value;
    this._inventory.route = value;
  }

  connectedCallback(): void {
    this.addEventListener("ac-filament-navigate", this._handleNavigate);
  }

  disconnectedCallback(): void {
    this.removeEventListener("ac-filament-navigate", this._handleNavigate);
  }

  private _handleNavigate = (ev: Event): void => {
    // The views changed their own state already; all that is left is to keep
    // the address bar honest so a reload and the browser's back button land on
    // the tab the user is looking at.
    ev.stopPropagation();

    const view = (ev as CustomEvent<{ view: string }>).detail.view;

    if (!view || !VIEWS.includes(view) || !this._route) {
      return;
    }

    window.history.pushState(null, "", `${this._route.prefix}/${view}`);
    window.dispatchEvent(
      new CustomEvent("location-changed", { detail: { replace: false } }),
    );
  };
}

if (!customElements.get(HOST_ELEMENT)) {
  customElements.define(HOST_ELEMENT, AnycubicFilamentManagerPanel);
}
