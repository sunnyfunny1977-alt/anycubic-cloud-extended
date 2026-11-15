/**
 * Filament Manager panel.
 *
 * A dependency-free web component: Home Assistant sets `hass`, `narrow`,
 * `panel` and `route` on it, the panel subscribes to the backend and re-renders
 * its shadow root whenever the inventory changes.
 */

import { platform } from "../const";

import { loadTranslations, t, translateError } from "./i18n.js";
import { panelStyles } from "./styles.js";
import { createLookup, itemLabel } from "./data.js";
import {
  dialog,
  dialogActions,
  html,
  icon,
  setFormatting,
} from "./ui.js";
import {
  OPTION_NONE,
  newSlotValues,
  slotDialogBody,
} from "./views/ace.js";
import { renderOverview } from "./views/overview.js";
import { newItemValues, setupDialogBody } from "./views/setup.js";
import {
  manufacturerDialogBody,
  materialDialogBody,
  newManufacturerValues,
  newMaterialValues,
  renderAdmin,
} from "./views/admin.js";

// The websocket namespace of the merged integration. `platform` is the single
// place the domain is written down on the frontend side.
const WS = `${platform}/filament`;
const VIEWS = ["overview", "admin"];

const EMPTY_DATA = {
  manufacturers: [],
  materials: [],
  spool_types: [],
  items: [],
  usage: { manufacturers: {}, materials: {}, spool_types: {} },
  summary: {
    entry_count: 0,
    sealed_spools: 0,
    open_spools: 0,
    total_spools: 0,
    total_grams: 0,
    total_kg: 0,
    inventory_value: 0,
    by_material: {},
    by_manufacturer: {},
  },
};

class FilamentManagerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._narrow = false;
    this._panel = null;
    this._route = null;

    this._ready = false;
    this._data = EMPTY_DATA;
    this._unsubscribe = null;
    this._toastTimer = null;
    this._overlayKey = "";

    this._state = {
      view: "overview",
      filters: { q: "", manufacturer: "", material: "", condition: "", sort: "manufacturer" },
    };
    this._dialog = null;

    this.shadowRoot.innerHTML = `
      <style>${panelStyles}</style>
      <div id="app"><div class="content"><div class="empty">…</div></div></div>
      <div id="overlay"></div>
      <div id="toast"></div>
    `;

    this._onClick = this._onClick.bind(this);
    this._onInput = this._onInput.bind(this);
    this._onChange = this._onChange.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  // -- Properties set by Home Assistant ------------------------------------

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._init();
  }

  get hass() {
    return this._hass;
  }

  set narrow(value) {
    this._narrow = Boolean(value);
    this.toggleAttribute("narrow", this._narrow);
  }

  set panel(value) {
    this._panel = value;
  }

  set route(value) {
    this._route = value;
    const parts = (value && value.path ? value.path : "")
      .split("/")
      .filter(Boolean);
    const last = parts.length ? parts[parts.length - 1] : "";
    const view = VIEWS.includes(last) ? last : "overview";
    if (view !== this._state.view) {
      this._state.view = view;
      if (this._ready) this._renderApp();
    }
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("click", this._onClick);
    this.shadowRoot.addEventListener("input", this._onInput);
    this.shadowRoot.addEventListener("change", this._onChange);
    this.shadowRoot.addEventListener("keydown", this._onKeyDown);
    if (this._hass) this._init();
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener("click", this._onClick);
    this.shadowRoot.removeEventListener("input", this._onInput);
    this.shadowRoot.removeEventListener("change", this._onChange);
    this.shadowRoot.removeEventListener("keydown", this._onKeyDown);
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    if (this._toastTimer) clearTimeout(this._toastTimer);
  }

  // -- Setup ---------------------------------------------------------------

  get _isAdmin() {
    return Boolean(this._hass && this._hass.user && this._hass.user.is_admin);
  }

  async _init() {
    if (this._initStarted) return;
    this._initStarted = true;

    const language = (this._hass.locale && this._hass.locale.language) || this._hass.language;
    try {
      await loadTranslations(language);
    } catch (err) {
      // Keep going with the raw keys rather than showing an empty panel.
      console.error("Filament Manager: cannot load translations", err);
    }
    setFormatting(language, (this._hass.config && this._hass.config.currency) || "EUR");

    this._renderLoading();
    await this._subscribe();
    this._ready = true;
    this._renderApp();
  }

  _renderLoading() {
    this.shadowRoot.getElementById("app").innerHTML = String(
      html`<div class="content"><div class="empty">${t("app.loading")}</div></div>`
    );
  }

  async _subscribe() {
    try {
      this._unsubscribe = await this._hass.connection.subscribeMessage(
        (message) => {
          if (message && message.snapshot) {
            this._data = message.snapshot;
            if (this._ready) {
              this._renderApp();
              this._refreshOpenDialog();
            }
          }
        },
        { type: `${WS}/subscribe` }
      );
    } catch (err) {
      console.error("Filament Manager: subscription failed", err);
      this._data = await this._hass.callWS({ type: `${WS}/data` }).catch(() => EMPTY_DATA);
    }
  }

  async _call(message) {
    try {
      return await this._hass.callWS(message);
    } catch (err) {
      this._toast(translateError(err), true);
      throw err;
    }
  }

  // -- Rendering -----------------------------------------------------------

  get _lookup() {
    return createLookup(this._data);
  }

  _context() {
    return {
      data: this._data,
      state: this._state,
      lookup: this._lookup,
      isAdmin: this._isAdmin,
      slots: this._aceSlots,
    };
  }

  /**
   * The ACE boxes the printers report, straight out of `hass.states`.
   *
   * Home Assistant pushes those sensors anyway, so reading them here costs no
   * traffic and needs no refresh of its own. Each entry already carries the
   * `printer_id`, `box_id` and `local_slot` a binding is keyed by.
   */
  get _aceSlots() {
    const states = (this._hass && this._hass.states) || {};
    const boxes = [];

    for (const [entityId, state] of Object.entries(states)) {
      const attributes = state.attributes || {};
      const info = attributes.spool_info;

      if (!Array.isArray(info) || !info.length) continue;

      // The matching active-filament sensor shares this one's prefix. Missing
      // is fine: the box simply shows no active marker.
      const active = (states[entityId.replace(/_spools$/, "_active_filament")] || {})
        .attributes;

      const slots = info
        .filter((slot) => slot && slot.printer_id && slot.local_slot)
        .map((slot) => ({
          ...slot,
          is_active: Boolean(
            active &&
              active.local_slot === slot.local_slot &&
              active.box_id === slot.box_id
          ),
        }));

      if (slots.length) {
        boxes.push({ name: attributes.friendly_name || entityId, slots });
      }
    }

    return boxes.sort((a, b) => a.name.localeCompare(b.name));
  }

  _renderApp() {
    const app = this.shadowRoot.getElementById("app");
    const active = this.shadowRoot.activeElement;
    const focusKey = active && active.dataset ? active.dataset.filter || null : null;
    const caret = focusKey && active.selectionStart !== undefined ? active.selectionStart : null;

    const ctx = this._context();
    const view = this._state.view === "admin" ? renderAdmin(ctx) : renderOverview(ctx);
    const tabs = VIEWS.filter((name) => name !== "admin" || this._isAdmin);

    app.innerHTML = String(html`
      <div class="app-header">
        <div class="toolbar">
          <button class="menu-button" data-action="toggle-menu" title="Menu">
            ${icon("menu", 24)}
          </button>
          <div class="title">${t("app.title")}</div>
        </div>
        ${tabs.length > 1
          ? html`<div class="tabs" role="tablist">
              ${tabs.map(
                (name) => html`<button
                  class="tab"
                  role="tab"
                  data-action="goto"
                  data-view="${name}"
                  aria-selected="${this._state.view === name ? "true" : "false"}"
                >
                  ${t(`tab.${name}`)}
                </button>`
              )}
            </div>`
          : ""}
      </div>
      <div class="content">${view}</div>
    `);

    if (focusKey) {
      const restored = app.querySelector(`[data-filter="${focusKey}"]`);
      if (restored) {
        restored.focus();
        if (caret !== null && restored.setSelectionRange) {
          try {
            restored.setSelectionRange(caret, caret);
          } catch {
            /* not supported for this input type */
          }
        }
      }
    }
  }

  _renderOverlay(force = false, focusFirst = false) {
    const container = this.shadowRoot.getElementById("overlay");
    const key = this._dialog
      ? `${this._dialog.kind}:${this._dialog.id || "new"}:${this._dialog.error || ""}`
      : "";
    if (!force && key === this._overlayKey) return;
    this._overlayKey = key;

    if (!this._dialog) {
      container.innerHTML = "";
      return;
    }

    const values = this._dialog.values || {};
    let body;
    let actions;

    if (this._dialog.kind === "slot") {
      body = slotDialogBody(values, this._dialog.slot);
      actions = dialogActions({ confirmLabel: t("action.save") });
    } else if (this._dialog.kind === "item") {
      const item = this._dialog.mode === "edit" ? this._findItem(this._dialog.id) : null;

      if (this._dialog.mode === "edit" && !item) {
        // Deleted from somewhere else while the dialog was open; there is
        // nothing left for the body to render.
        this._closeDialog();
        return;
      }

      // Recorded from what is actually on screen, so the snapshot handler can
      // tell a stock change from a change it should ignore.
      this._dialog.signature = this._itemSignature(item);
      body = setupDialogBody(values, this._data, this._lookup, item, this._isAdmin);
      actions = dialogActions({
        confirmLabel: t("action.save"),
        extra: item
          ? html`<button class="btn danger text" data-action="delete-item" data-item="${item.id}">
              ${t("action.delete")}
            </button>`
          : "",
      });
    } else if (this._dialog.kind === "manufacturer") {
      body = manufacturerDialogBody(values, this._data, this._lookup);
      actions = dialogActions({ confirmLabel: t("action.save") });
    } else if (this._dialog.kind === "material") {
      body = materialDialogBody(values);
      actions = dialogActions({ confirmLabel: t("action.save") });
    } else {
      body = html`<p>${this._dialog.text}</p>`;
      actions = dialogActions({
        confirmLabel: this._dialog.confirmLabel || t("action.delete"),
        danger: true,
      });
    }

    container.innerHTML = String(
      dialog({ title: this._dialog.title, body, actions, error: this._dialog.error })
    );

    if (!focusFirst) return;

    const firstField = container.querySelector("[data-field]");
    if (firstField) firstField.focus();
  }

  /**
   * What an open setup dialog needs a repaint for: a spool opened or consumed,
   * or the sealed count stepped. Field values are deliberately not part of it.
   */
  _itemSignature(item) {
    if (!item) return "";
    return `${item.sealed_count}|${(item.open_spools || [])
      .map((spool) => spool.id)
      .join(",")}`;
  }

  /**
   * Bring an open setup dialog up to date with a pushed snapshot.
   *
   * Not on every push: the spool fields save on change and the gross-weight
   * field renders empty by design, so repainting while somebody is typing in
   * the dialog would throw away what they had entered. A structural change is
   * always worth the repaint; anything else waits until the dialog is idle.
   */
  _refreshOpenDialog() {
    const state = this._dialog;
    if (!state || state.kind !== "item" || state.mode !== "edit") return;

    const item = this._findItem(state.id);
    if (!item) {
      this._closeDialog();
      return;
    }

    const active = this.shadowRoot.activeElement;
    const typing = Boolean(active && active.closest && active.closest(".overlay"));

    if (this._itemSignature(item) === state.signature && typing) return;

    this._renderOverlay(true);
  }

  _toast(message, isError = false) {
    const container = this.shadowRoot.getElementById("toast");
    container.innerHTML = String(
      html`<div class="toast ${isError ? "error" : ""}">${message}</div>`
    );
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      container.innerHTML = "";
    }, isError ? 6000 : 2500);
  }

  // -- Navigation ----------------------------------------------------------

  _navigate(view) {
    if (!VIEWS.includes(view)) return;
    this._state.view = view;
    // The host panel owns the URL. It listens for this and rewrites the route
    // to .../filament/<view>, which comes back in through `set route`.
    this.dispatchEvent(
      new CustomEvent("ac-filament-navigate", {
        detail: { view },
        bubbles: true,
        composed: true,
      })
    );
    this._renderApp();
  }

  // -- Dialog helpers ------------------------------------------------------

  _openDialog(config) {
    this._dialog = { error: "", ...config };
    this._renderOverlay(true, true);
  }

  /**
   * Close the top dialog.
   *
   * A confirmation replaces the dialog it was raised from, so it carries a
   * `previous` back to it. Handling that here rather than in the handler covers
   * cancel, the backdrop and Escape in one place -- otherwise abandoning a
   * confirmation would silently throw away the setup dialog behind it.
   */
  _closeDialog() {
    this._dialog = (this._dialog && this._dialog.previous) || null;
    this._renderOverlay(true);
  }

  _setDialogError(message) {
    if (!this._dialog) return;
    this._dialog.error = message;
    this._renderOverlay(true);
  }

  _confirm({ previous, title, text, confirmLabel, onConfirm }) {
    this._openDialog({ kind: "confirm", previous, title, text, confirmLabel, onConfirm });
  }

  /** Message shown when master data is still referenced by entries. */
  _blockedMessage(name, count) {
    const key = count === 1 ? "admin.delete_blocked_one" : "admin.delete_blocked";
    return t(key, { name, count });
  }

  _findItem(id) {
    return (this._data.items || []).find((item) => item.id === id) || null;
  }

  // -- Event handling ------------------------------------------------------

  _onKeyDown(event) {
    if (event.key === "Escape" && this._dialog) {
      event.preventDefault();
      this._closeDialog();
      return;
    }
    // A spool field saves on change. Committing the form here would close the
    // dialog and, because of preventDefault, swallow the value just typed.
    if (
      event.key === "Enter" &&
      event.target.closest &&
      event.target.closest(".spool-edit")
    ) {
      event.preventDefault();
      event.target.blur();
      return;
    }
    if (
      event.key === "Enter" &&
      this._dialog &&
      this._dialog.kind !== "confirm" &&
      event.target.tagName === "INPUT"
    ) {
      event.preventDefault();
      this._commitDialog();
    }
  }

  /** Filter inputs live in the main area and re-render the list as you type. */
  _applyFilter(target) {
    if (target.dataset.filter) {
      this._state.filters[target.dataset.filter] = target.value;
      this._renderApp();
      return true;
    }
    return false;
  }

  /** Dialog fields are kept in state without re-rendering, so focus survives. */
  _captureDialogField(target) {
    if (!this._dialog || !target.dataset.field || !target.closest(".overlay")) return false;
    // A spool editor inside the dialog writes straight to its own record; it
    // must not be mistaken for part of the entry's form.
    if (target.closest(".spool-edit")) return false;
    this._dialog.values[target.dataset.field] = target.value;
    return true;
  }

  _onInput(event) {
    const target = event.target;
    if (!target || !target.dataset) return;
    if (this._applyFilter(target)) return;
    this._captureDialogField(target);
  }

  _onChange(event) {
    const target = event.target;
    if (!target || !target.dataset) return;
    if (this._applyFilter(target)) return;
    if (this._captureDialogField(target)) {
      // Picking a roll decides the tare, and the tare decides whether the
      // weight field is usable at all -- so this one field has to repaint.
      if (this._dialog.kind === "slot" && target.dataset.field === "candidate") {
        this._renderOverlay(true);
      }
      return;
    }
    // Inline editing of an opened spool, inside the setup dialog.
    const editor = target.closest(".spool-edit");
    if (editor && target.dataset.field) {
      this._call({
        type: `${WS}/spool/update`,
        item_id: editor.dataset.item,
        spool_id: editor.dataset.spool,
        [target.dataset.field]: target.value === "" ? null : target.value,
      }).catch(() => {});
    }
  }

  _onClick(event) {
    const trigger = event.composedPath().find((node) => node.dataset && node.dataset.action);
    if (!trigger) return;
    const { action } = trigger.dataset;

    // Clicks inside the dialog box must not close it through the backdrop.
    if (action === "dialog-backdrop" && event.target !== trigger) return;

    const handler = this._actions()[action];
    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      handler(trigger.dataset, trigger);
    }
  }

  _actions() {
    const ws = (message) => this._call(message).catch(() => {});

    return {
      "toggle-menu": () =>
        this.dispatchEvent(
          new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true })
        ),
      goto: (dataset) => this._navigate(dataset.view),

      "reset-filters": () => {
        this._state.filters = {
          q: "",
          manufacturer: "",
          material: "",
          condition: "",
          sort: "manufacturer",
        };
        this._renderApp();
      },

      // ---- inventory items ----
      "new-item": () =>
        this._openDialog({
          kind: "item",
          mode: "new",
          title: t("dialog.item.new"),
          values: newItemValues(this._data),
        }),

      "setup-item": (dataset) => {
        const item = this._findItem(dataset.item);
        if (!item) return;
        const spoolType = this._lookup.spoolTypeFor(item);
        this._openDialog({
          kind: "item",
          mode: "edit",
          id: item.id,
          title: t("dialog.item.edit"),
          values: {
            manufacturer_id: item.manufacturer_id,
            material_id: item.material_id,
            color_name: item.color_name,
            color_hex: item.color_hex,
            diameter: item.diameter,
            spool_net_weight_g: item.spool_net_weight_g,
            location: item.location,
            price: item.price ?? "",
            purchase_date: item.purchase_date ?? "",
            nozzle_temp: item.nozzle_temp ?? "",
            bed_temp: item.bed_temp ?? "",
            notes: item.notes,
            ...(spoolType
              ? { [`spool_type__${spoolType.id}`]: spoolType.empty_weight_g ?? "" }
              : {}),
          },
        });
      },

      "delete-item": (dataset) => {
        const item = this._findItem(dataset.item);
        if (!item) return;
        this._confirm({
          title: t("setup.delete_title"),
          text: t("setup.delete_text", { name: itemLabel(item, this._lookup) }),
          onConfirm: async () => {
            await this._call({ type: `${WS}/item/delete`, item_id: item.id });
            this._toast(t("toast.deleted"));
          },
        });
      },

      "sealed-plus": (dataset) => {
        const item = this._findItem(dataset.item);
        if (!item) return;
        ws({
          type: `${WS}/item/set_sealed`,
          item_id: item.id,
          sealed_count: Number(item.sealed_count || 0) + 1,
        });
      },

      "sealed-minus": (dataset) => {
        const item = this._findItem(dataset.item);
        if (!item || Number(item.sealed_count || 0) < 1) return;
        ws({
          type: `${WS}/item/set_sealed`,
          item_id: item.id,
          sealed_count: Number(item.sealed_count) - 1,
        });
      },

      "open-spool": (dataset) => {
        ws({ type: `${WS}/spool/open`, item_id: dataset.item });
      },

      "consume-spool": (dataset) => {
        const item = this._findItem(dataset.item);
        if (!item) return;
        this._confirm({
          previous: this._dialog,
          title: t("setup.consume_title"),
          text: t("setup.consume_text", { name: itemLabel(item, this._lookup) }),
          confirmLabel: t("setup.consume"),
          onConfirm: async () => {
            await this._call({
              type: `${WS}/spool/consume`,
              item_id: dataset.item,
              spool_id: dataset.spool,
            });
            this._toast(t("toast.deleted"));
          },
        });
      },

      // ---- ACE slots ----
      "assign-slot": (dataset) => this._openSlotDialog(dataset),

      // Only the binding goes: the roll keeps the remaining weight the
      // automatic deduction has arrived at and stays in the cupboard.
      "clear-slot": (dataset) => {
        this._confirm({
          title: t("ace.clear_title"),
          text: t("ace.clear_text", {
            name: dataset.label || t("ace.clear_fallback"),
            slot: dataset.slot,
          }),
          confirmLabel: t("ace.clear_confirm"),
          onConfirm: async () => {
            await this._call({
              type: `${WS}/slot/clear`,
              printer_id: String(dataset.printer),
              box_id: Number(dataset.box),
              local_slot: Number(dataset.slot),
            });
            this._toast(t("ace.clear_toast"));
          },
        });
      },

      "copy-id": async (dataset) => {
        try {
          await navigator.clipboard.writeText(dataset.id);
          this._toast(t("toast.id_copied"));
        } catch {
          this._toast(dataset.id);
        }
      },

      // ---- master data ----
      "new-manufacturer": () =>
        this._openDialog({
          kind: "manufacturer",
          mode: "new",
          title: t("dialog.manufacturer.new"),
          values: newManufacturerValues(this._data),
        }),

      "edit-manufacturer": (dataset) => {
        const entry = this._data.manufacturers.find((one) => one.id === dataset.id);
        if (!entry) return;
        this._openDialog({
          kind: "manufacturer",
          mode: "edit",
          id: entry.id,
          title: t("dialog.manufacturer.edit"),
          values: {
            id: entry.id,
            name: entry.name,
            website: entry.website,
            sort_order: entry.sort_order,
            // One field per spool type of this manufacturer, saved together
            // with the master data when the dialog is confirmed.
            ...Object.fromEntries(
              (this._data.spool_types || [])
                .filter((type) => type.manufacturer_id === entry.id)
                .map((type) => [`spool_type__${type.id}`, type.empty_weight_g ?? ""])
            ),
          },
        });
      },

      "delete-manufacturer": (dataset) => {
        const entry = this._data.manufacturers.find((one) => one.id === dataset.id);
        if (!entry) return;
        const used = (this._data.usage.manufacturers || {})[entry.id] || 0;
        if (used > 0) {
          this._toast(this._blockedMessage(entry.name, used), true);
          return;
        }
        this._confirm({
          title: t("admin.delete_manufacturer_title"),
          text: t("admin.delete_text", { name: entry.name }),
          onConfirm: async () => {
            await this._call({
              type: `${WS}/manufacturer/delete`,
              manufacturer_id: entry.id,
            });
            this._toast(t("toast.deleted"));
          },
        });
      },

      "new-material": () =>
        this._openDialog({
          kind: "material",
          mode: "new",
          title: t("dialog.material.new"),
          values: newMaterialValues(this._data),
        }),

      "edit-material": (dataset) => {
        const entry = this._data.materials.find((one) => one.id === dataset.id);
        if (!entry) return;
        this._openDialog({
          kind: "material",
          mode: "edit",
          id: entry.id,
          title: t("dialog.material.edit"),
          values: {
            name: entry.name,
            nozzle_temp: entry.nozzle_temp ?? "",
            bed_temp: entry.bed_temp ?? "",
            density: entry.density ?? "",
            sort_order: entry.sort_order,
            ace_material_type: entry.ace_material_type ?? "",
          },
        });
      },

      "delete-material": (dataset) => {
        const entry = this._data.materials.find((one) => one.id === dataset.id);
        if (!entry) return;
        const used = (this._data.usage.materials || {})[entry.id] || 0;
        if (used > 0) {
          this._toast(this._blockedMessage(entry.name, used), true);
          return;
        }
        this._confirm({
          title: t("admin.delete_material_title"),
          text: t("admin.delete_text", { name: entry.name }),
          onConfirm: async () => {
            await this._call({ type: `${WS}/material/delete`, material_id: entry.id });
            this._toast(t("toast.deleted"));
          },
        });
      },

      // ---- dialog ----
      "dialog-backdrop": () => this._closeDialog(),
      "dialog-cancel": () => this._closeDialog(),
      "dialog-confirm": () => this._commitDialog(),
    };
  }

  /**
   * Open the dialog for one ACE slot and fetch what may go in it.
   *
   * The candidate list is filtered server-side by the material the slot
   * reports, so the same normalisation decides here and in the printer panel.
   */
  async _openSlotDialog(dataset) {
    const slot = {
      printer_id: String(dataset.printer),
      box_id: Number(dataset.box),
      local_slot: Number(dataset.slot),
    };

    this._openDialog({
      kind: "slot",
      id: `${slot.printer_id}:${slot.box_id}:${slot.local_slot}`,
      title: t("ace.dialog_title", { slot: slot.local_slot }),
      values: newSlotValues(null),
      slot: { ...slot, loading: true, candidates: [] },
    });

    let result;
    try {
      result = await this._call({ type: `${WS}/slot/candidates`, ...slot });
    } catch {
      this._closeDialog();
      return;
    }

    // The dialog may have been closed while the request was in flight.
    if (!this._dialog || this._dialog.kind !== "slot") return;

    this._dialog.slot = {
      ...slot,
      loading: false,
      candidates: result.candidates || [],
      assignment: result.assignment || null,
      needsTare: Boolean(result.needs_tare),
      materialType: result.material_type || null,
    };
    this._dialog.values = newSlotValues(result.assignment || null);
    this._renderOverlay(true);
  }

  /**
   * Apply the dialog: bind the roll, and book a fresh weighing if one was
   * entered. The weight is optional on purpose -- the automatic deduction is
   * what keeps the cupboard current, and weighing only corrects its drift.
   */
  async _commitSlot() {
    const { values, slot } = this._dialog;
    const target = {
      printer_id: slot.printer_id,
      box_id: slot.box_id,
      local_slot: slot.local_slot,
    };

    if (!values.candidate) {
      this._setDialogError(t("ace.error_pick"));
      return;
    }

    try {
      if (values.candidate === OPTION_NONE) {
        await this._call({ type: `${WS}/slot/clear`, ...target });
      } else {
        const [itemId, spoolId] = String(values.candidate).split(":");
        await this._call({
          type: `${WS}/slot/assign`,
          ...target,
          item_id: itemId,
          spool_id: spoolId || null,
        });

        const gross = parseFloat(values.gross_weight_g);
        if (!isNaN(gross)) {
          const tare = parseFloat(values.empty_weight_g);
          await this._call({
            type: `${WS}/slot/weigh`,
            ...target,
            gross_weight_g: gross,
            empty_weight_g: isNaN(tare) ? null : tare,
          });
        }
      }
    } catch {
      return;
    }

    this._closeDialog();
    this._toast(t("toast.saved"));
  }

  async _commitDialog() {
    if (!this._dialog) return;
    const { kind, mode, id, values } = this._dialog;

    if (kind === "confirm") {
      const { onConfirm } = this._dialog;
      this._closeDialog();
      if (onConfirm) await onConfirm().catch(() => {});
      return;
    }

    if (kind === "slot") {
      await this._commitSlot();
      return;
    }

    if (kind === "item") {
      if (!values.manufacturer_id || !values.material_id) {
        this._setDialogError(t("error.item_required"));
        return;
      }
    } else if (!String(values.name || "").trim()) {
      this._setDialogError(t("error.name_required"));
      return;
    }

    const target = { item: "item", manufacturer: "manufacturer", material: "material" }[kind];
    const message = {
      type: `${WS}/${target}/${mode === "edit" ? "update" : "create"}`,
      ...this._cleanValues(values),
    };
    // The record id must not be sent as "id" — the websocket client uses that
    // key for the message number and would overwrite it.
    if (mode === "edit") message[`${target}_id`] = id;

    try {
      await this._call(message);
      await this._saveSpoolTypeWeights(values);
    } catch {
      return;
    }
    this._closeDialog();
    this._toast(t("toast.saved"));
  }

  /**
   * Send every empty weight the manufacturer dialog changed.
   *
   * They live on their own records, so the dialog collects them under
   * `spool_type__<id>` keys and they are written after the master data.
   */
  async _saveSpoolTypeWeights(values) {
    const current = new Map(
      (this._data.spool_types || []).map((type) => [type.id, type.empty_weight_g])
    );
    for (const [key, value] of Object.entries(values)) {
      if (!key.startsWith("spool_type__")) continue;
      const id = key.slice("spool_type__".length);
      const wanted = value === "" || value === null ? null : Number(value);
      if (!current.has(id) || current.get(id) === wanted) continue;
      await this._call({
        type: `${WS}/spool_type/update`,
        spool_type_id: id,
        empty_weight_g: wanted,
      });
    }
  }

  /** Turn empty form fields into nulls the backend reads as "not set". */
  _cleanValues(values) {
    const cleaned = {};
    for (const [key, value] of Object.entries(values)) {
      // Handled separately by _saveSpoolTypeWeights.
      if (key.startsWith("spool_type__") || key === "id") continue;
      cleaned[key] = value === "" ? null : value;
    }
    return cleaned;
  }
}

if (!customElements.get("anycubic-filament-panel")) {
  customElements.define("anycubic-filament-panel", FilamentManagerPanel);
}
