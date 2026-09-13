/**
 * The setup dialog: everything there is to do with one inventory entry.
 *
 * It renders from two sources on purpose. The form fields come from `values`,
 * the dialog's own working copy, so half-typed input survives a repaint.
 * Everything derived from stock — the open spools, the sealed count, the tare —
 * comes from `item`, the live record out of the last snapshot. Nothing is
 * merged between the two, so neither can go stale against the other.
 *
 * `item` is null while creating an entry: there is no stock to manage yet, so
 * only the master data section is rendered.
 */

import { t } from "../i18n.js";
import {
  colorField,
  fmtDate,
  fmtNumber,
  html,
  icon,
  progressBar,
  raw,
  selectField,
  textAreaField,
  textField,
} from "../ui.js";
import { itemTare, spoolPercent } from "../data.js";

const NET_WEIGHT_PRESETS = [200, 250, 500, 750, 1000, 2000, 3000];
const DIAMETERS = [1.75, 2.85, 3.0];

// Section headings inside a `.form-grid` need the inline margin: the grid's
// `:first-child` reset would otherwise pull the first one onto the row above.
const SECTION_STYLE = "margin:8px 0 4px";

function openSpoolEditor(item, spool, index, tare) {
  const net = Number(item.spool_net_weight_g || 0);
  const hasTare = tare !== null && tare !== undefined;
  // Read-only: the percentage follows from the grams.
  const percent = spoolPercent(spool, net);
  return html`<div class="spool-edit" data-item="${item.id}" data-spool="${spool.id}">
    <div class="grow">
      <div class="open-row">
        <span class="chip muted">${t("label.spool_index", { index: index + 1 })}</span>
        ${progressBar(percent)}
        <span class="amount">${percent === null ? "–" : `${fmtNumber(percent, 0)} %`}</span>
      </div>
      <div class="hint">
        ${t("label.opened_at")}: ${fmtDate(spool.opened_at)}
      </div>
    </div>
    <div class="num-field">
      ${textField({
        name: "remaining_grams",
        label: t("field.remaining_grams"),
        type: "number",
        min: 0,
        step: 1,
        value: spool.remaining_grams,
      })}
    </div>
    <div class="num-field">
      ${textField({
        name: "gross_weight_g",
        label: t("field.gross_weight"),
        type: "number",
        min: 0,
        step: 1,
        // Never prefilled: this is a calculator input, not a stored value.
        value: "",
        placeholder: hasTare ? "" : "—",
        disabled: !hasTare,
        title: hasTare ? t("field.gross_weight_hint") : t("field.gross_weight_disabled"),
      })}
    </div>
    <div class="grow">
      ${textField({ name: "note", label: t("field.note"), value: spool.note })}
    </div>
    <button
      class="btn danger text"
      data-action="consume-spool"
      data-item="${item.id}"
      data-spool="${spool.id}"
    >
      ${t("setup.consume")}
    </button>
  </div>`;
}

/**
 * Sealed stock: a stepper and the button that opens a spool.
 *
 * The stepper writes straight through to the backend instead of going into the
 * form. `item/update` only carries the fields it is sent, so an immediate
 * `set_sealed` and a later save of the master data cannot fight over the count
 * — which is also why the form has no sealed-count field in edit mode.
 */
function stockSection(item, isAdmin) {
  const sealed = Number(item.sealed_count || 0);

  return html`<div class="span-2">
    <div class="section-title" style="${SECTION_STYLE}">${t("setup.section_stock")}</div>
    <div class="row-main">
      <div class="grow">
        <div class="name">${t("setup.sealed_count")}</div>
        <div class="sub hint">${t("label.sealed", { count: sealed })}</div>
      </div>
      <span class="counter">
        <button
          class="icon-btn plain"
          data-action="sealed-minus"
          data-item="${item.id}"
          title="-1"
          ${raw(!isAdmin || sealed < 1 ? "disabled" : "")}
        >
          ${icon("minus")}
        </button>
        <span class="num">${sealed}</span>
        <button
          class="icon-btn plain"
          data-action="sealed-plus"
          data-item="${item.id}"
          title="+1"
          ${raw(isAdmin ? "" : "disabled")}
        >
          ${icon("plus")}
        </button>
      </span>
      <button
        class="btn secondary"
        data-action="open-spool"
        data-item="${item.id}"
        ${raw(!isAdmin || sealed < 1 ? "disabled" : "")}
      >
        ${t("setup.open_spool")}
      </button>
    </div>
  </div>`;
}

/**
 * The empty weight of the bare spool.
 *
 * It belongs to the spool type, not to this entry, so it is shared by every
 * colour of the same manufacturer, material and size — the label spells that
 * combination out so the scope is visible before anybody types a number.
 * Collected as `spool_type__<id>` and written by the dialog's existing
 * `_saveSpoolTypeWeights`, which is why it needs no plumbing of its own.
 */
function tareSection(item, values, lookup) {
  const spoolType = lookup.spoolTypeFor(item);

  const body = spoolType
    ? html`<div class="tare-list">
        <div class="tare-row">
          <div class="grow">
            <div class="name">
              ${lookup.manufacturerName(spoolType.manufacturer_id)}
              ${lookup.materialName(spoolType.material_id)} ·
              ${fmtNumber(spoolType.net_weight_g)} g
            </div>
          </div>
          <div class="num-field">
            ${textField({
              name: `spool_type__${spoolType.id}`,
              label: t("field.empty_weight_short"),
              type: "number",
              min: 0,
              step: 0.1,
              value: values[`spool_type__${spoolType.id}`],
            })}
          </div>
        </div>
      </div>`
    : html`<div class="hint">${t("setup.no_spool_type")}</div>`;

  return html`<div class="span-2">
    <div class="section-title" style="${SECTION_STYLE}">${t("setup.section_tare")}</div>
    <div class="hint">${t("setup.tare_hint")}</div>
    ${body}
  </div>`;
}

/** The opened spools of this entry, each with its own weighing fields. */
function openSpoolsSection(item, tare) {
  const open = item.open_spools || [];
  const hasTare = tare !== null && tare !== undefined;

  return html`<div class="span-2">
    <div class="section-title" style="${SECTION_STYLE}">${t("setup.open_spools_title")}</div>
    <div class="hint">
      ${t("field.remaining_hint")}
      ${hasTare ? ` ${t("field.gross_weight_hint")}` : ` ${t("field.gross_weight_disabled")}`}
    </div>
    ${open.length
      ? html`<div class="sub-list">
          ${open.map((spool, index) => openSpoolEditor(item, spool, index, tare))}
        </div>`
      : html`<div class="hint">${t("setup.no_open_spools")}</div>`}
  </div>`;
}

/** Body of the setup dialog. `item` is null while creating an entry. */
export function setupDialogBody(values, data, lookup, item, isAdmin) {
  const tare = item ? itemTare(item, lookup) : null;

  return html`<div class="form-grid">
    ${selectField({
      name: "manufacturer_id",
      label: t("field.manufacturer"),
      value: values.manufacturer_id,
      placeholder: "—",
      options: data.manufacturers.map((entry) => ({ value: entry.id, label: entry.name })),
    })}
    ${selectField({
      name: "material_id",
      label: t("field.material"),
      value: values.material_id,
      placeholder: "—",
      options: data.materials.map((entry) => ({ value: entry.id, label: entry.name })),
    })}

    <div class="span-2">
      ${colorField({
        nameText: "color_name",
        nameHex: "color_hex",
        label: t("field.color_name"),
        textValue: values.color_name,
        hexValue: values.color_hex || "#9e9e9e",
        placeholder: t("field.color_name_placeholder"),
      })}
    </div>

    ${selectField({
      name: "diameter",
      label: t("field.diameter"),
      value: values.diameter,
      options: DIAMETERS.map((value) => ({ value, label: `${value} mm` })),
    })}
    ${selectField({
      name: "spool_net_weight_g",
      label: t("field.net_weight"),
      value: values.spool_net_weight_g,
      options: NET_WEIGHT_PRESETS.map((value) => ({ value, label: `${value} g` })),
    })}

    ${textField({
      name: "location",
      label: t("field.location"),
      value: values.location,
      placeholder: t("field.location_placeholder"),
    })}
    ${item
      ? ""
      : textField({
          // Only while creating. Once the entry exists the stepper below owns
          // the count, and a form field would overwrite it on every save.
          name: "sealed_count",
          label: t("field.sealed_count"),
          type: "number",
          min: 0,
          step: 1,
          value: values.sealed_count,
        })}

    ${textField({
      name: "price",
      label: t("field.price"),
      type: "number",
      min: 0,
      step: 0.01,
      value: values.price,
    })}
    ${textField({
      name: "purchase_date",
      label: t("field.purchase_date"),
      type: "date",
      value: values.purchase_date,
    })}

    ${textField({
      name: "nozzle_temp",
      label: t("field.nozzle_temp"),
      type: "number",
      min: 0,
      max: 600,
      step: 5,
      value: values.nozzle_temp,
      hint: t("field.temp_hint"),
    })}
    ${textField({
      name: "bed_temp",
      label: t("field.bed_temp"),
      type: "number",
      min: 0,
      max: 300,
      step: 5,
      value: values.bed_temp,
      hint: t("field.temp_hint"),
    })}

    <div class="span-2">
      ${textAreaField({ name: "notes", label: t("field.notes"), value: values.notes })}
    </div>

    ${item ? stockSection(item, isAdmin) : ""}
    ${item ? tareSection(item, values, lookup) : ""}
    ${item ? openSpoolsSection(item, tare) : ""}
    ${item
      ? html`<div class="span-2">
          <div class="hint">
            ID:
            <button class="id-badge" data-action="copy-id" data-id="${item.id}" title="${t("setup.copy_id")}">
              ${item.id}
            </button>
          </div>
        </div>`
      : ""}
  </div>`;
}

/** Default values for a new item. */
export function newItemValues(data) {
  return {
    manufacturer_id: data.manufacturers[0]?.id || "",
    material_id: data.materials[0]?.id || "",
    color_name: "",
    color_hex: "#9e9e9e",
    diameter: 1.75,
    spool_net_weight_g: 1000,
    sealed_count: 1,
    location: "",
    price: "",
    purchase_date: "",
    nozzle_temp: "",
    bed_temp: "",
    notes: "",
  };
}
