/**
 * The admin view: master data for manufacturers and filament types.
 */

import { t } from "../i18n.js";
import {
  emptyState,
  fmtNumber,
  html,
  icon,
  raw,
  selectField,
  textField,
} from "../ui.js";

function usageChip(count) {
  if (count === 0) return html`<span class="chip muted">${t("admin.unused")}</span>`;
  const key = count === 1 ? "admin.used_in_one" : "admin.used_in";
  return html`<span class="chip">${t(key, { count })}</span>`;
}

function masterRow({ entry, subtitle, usage, editAction, deleteAction }) {
  return html`<div class="row">
    <div class="row-main">
      <div class="grow">
        <div class="name">${entry.name}</div>
        <div class="sub hint">${subtitle}</div>
      </div>
      <div class="row-actions">
        ${usageChip(usage)}
        <button
          class="icon-btn"
          data-action="${editAction}"
          data-id="${entry.id}"
          title="${t("action.edit")}"
        >
          ${icon("pencil")}
        </button>
        <button
          class="icon-btn danger"
          data-action="${deleteAction}"
          data-id="${entry.id}"
          title="${t("action.delete")}"
          ${raw(usage > 0 ? "disabled" : "")}
        >
          ${icon("delete")}
        </button>
      </div>
    </div>
  </div>`;
}

/**
 * Website plus, when something is missing, how many spool types of this
 * manufacturer still have no empty weight — so the gap is visible without
 * opening every dialog.
 */
function manufacturerSubtitle(entry, data) {
  const mine = (data.spool_types || []).filter((type) => type.manufacturer_id === entry.id);
  const open = mine.filter(
    (type) => type.empty_weight_g === null || type.empty_weight_g === undefined
  ).length;
  const website = entry.website || "—";
  if (!open) return website;
  return `${website} · ${t("admin.tare_open", { count: open, total: mine.length })}`;
}

function materialSubtitle(entry) {
  const temps =
    entry.nozzle_temp !== null || entry.bed_temp !== null
      ? t("admin.temps", {
          nozzle: entry.nozzle_temp ?? "–",
          bed: entry.bed_temp ?? "–",
        })
      : t("admin.no_temps");
  const density =
    entry.density !== null && entry.density !== undefined
      ? ` · ${fmtNumber(entry.density, 2)} g/cm³`
      : "";
  return `${temps}${density}`;
}

/** Render the admin view. */
// The material types an ACE reports. A material may name one explicitly when
// the automatic name match gets it wrong; leaving it empty means "derive it
// from the name", which is right for every default material.
const ACE_MATERIAL_TYPES = [
  "PLA",
  "PETG",
  "ABS",
  "PACF",
  "PC",
  "ASA",
  "HIPS",
  "PA",
  "PLA_SE",
];

export function renderAdmin(ctx) {
  const { data, isAdmin } = ctx;

  if (!isAdmin) {
    return emptyState({
      emoji: "🔒",
      title: t("admin.only_admin.title"),
      text: t("admin.only_admin.text"),
    });
  }

  const usage = data.usage || { manufacturers: {}, materials: {}, spool_types: {} };

  return html`<div class="section-title">
      <span>${t("admin.title")} — ${t("admin.manufacturers")}</span>
      <span class="spacer"></span>
      <button class="btn" data-action="new-manufacturer">
        ${icon("plus")} ${t("admin.new_manufacturer")}
      </button>
    </div>
    ${data.manufacturers.length
      ? html`<div class="list">
          ${data.manufacturers.map((entry) =>
            masterRow({
              entry,
              subtitle: manufacturerSubtitle(entry, data),
              usage: usage.manufacturers[entry.id] || 0,
              editAction: "edit-manufacturer",
              deleteAction: "delete-manufacturer",
            })
          )}
        </div>`
      : html`<div class="card">${t("admin.no_manufacturers")}</div>`}

    <div class="section-title">
      <span>${t("admin.materials")}</span>
      <span class="spacer"></span>
      <button class="btn" data-action="new-material">
        ${icon("plus")} ${t("admin.new_material")}
      </button>
    </div>
    ${data.materials.length
      ? html`<div class="list">
          ${data.materials.map((entry) =>
            masterRow({
              entry,
              subtitle: materialSubtitle(entry),
              usage: usage.materials[entry.id] || 0,
              editAction: "edit-material",
              deleteAction: "delete-material",
            })
          )}
        </div>`
      : html`<div class="card">${t("admin.no_materials")}</div>`}
`;
}

/**
 * Body of the manufacturer dialog.
 *
 * Below the master data it lists every spool type of this manufacturer with
 * its empty weight, because that weight belongs to the manufacturer's spools
 * rather than to a single colour. The rows appear on their own as soon as an
 * inventory entry uses the combination.
 */
export function manufacturerDialogBody(values, data, lookup) {
  const spoolTypes = (data.spool_types || []).filter(
    (type) => type.manufacturer_id === values.id
  );

  return html`<div class="form-grid">
    <div class="span-2">
      ${textField({ name: "name", label: t("field.name"), value: values.name })}
    </div>
    <div class="span-2">
      ${textField({
        name: "website",
        label: `${t("field.website")} (${t("field.optional")})`,
        value: values.website,
        placeholder: "https://",
      })}
    </div>
    ${textField({
      name: "sort_order",
      label: t("field.sort_order"),
      type: "number",
      min: 0,
      step: 1,
      value: values.sort_order,
    })}

    <div class="span-2">
      <div class="section-title" style="margin:8px 0 4px">${t("admin.spool_types")}</div>
      <div class="hint" style="margin-bottom:10px">${t("admin.spool_types_hint")}</div>
      ${spoolTypes.length
        ? html`<div class="tare-list">
            ${spoolTypes.map((type) => {
              const usage = (data.usage?.spool_types || {})[type.id] || 0;
              return html`<div class="tare-row">
                <div class="grow">
                  <div class="name">
                    ${lookup.materialName(type.material_id)} ·
                    ${fmtNumber(type.net_weight_g)} g
                  </div>
                  <div class="hint">
                    ${usage
                      ? t(usage === 1 ? "admin.used_in_one" : "admin.used_in", { count: usage })
                      : t("admin.unused")}
                  </div>
                </div>
                <div class="num-field">
                  ${textField({
                    name: `spool_type__${type.id}`,
                    label: t("field.empty_weight_short"),
                    type: "number",
                    min: 0,
                    step: 0.1,
                    value: values[`spool_type__${type.id}`],
                  })}
                </div>
              </div>`;
            })}
          </div>`
        : html`<div class="hint">${t("admin.no_spool_types_for_manufacturer")}</div>`}
    </div>
  </div>`;
}

/** Body of the filament type dialog. */
export function materialDialogBody(values) {
  return html`<div class="form-grid">
    <div class="span-2">
      ${textField({ name: "name", label: t("field.name"), value: values.name })}
    </div>
    ${textField({
      name: "nozzle_temp",
      label: t("field.nozzle_temp"),
      type: "number",
      min: 0,
      max: 600,
      step: 5,
      value: values.nozzle_temp,
    })}
    ${textField({
      name: "bed_temp",
      label: t("field.bed_temp"),
      type: "number",
      min: 0,
      max: 300,
      step: 5,
      value: values.bed_temp,
    })}
    ${textField({
      name: "density",
      label: t("field.density"),
      type: "number",
      min: 0.1,
      max: 10,
      step: 0.01,
      value: values.density,
    })}
    ${textField({
      name: "sort_order",
      label: t("field.sort_order"),
      type: "number",
      min: 0,
      step: 1,
      value: values.sort_order,
    })}
    <div class="span-2">
      ${selectField({
        name: "ace_material_type",
        label: t("field.ace_material_type"),
        value: values.ace_material_type || "",
        placeholder: t("field.ace_material_type_auto"),
        options: ACE_MATERIAL_TYPES.map((type) => ({ value: type, label: type })),
        hint: t("field.ace_material_type_hint"),
      })}
    </div>
  </div>`;
}

export function newManufacturerValues(data) {
  return { name: "", website: "", sort_order: data.manufacturers.length };
}

export function newMaterialValues(data) {
  return {
    name: "",
    nozzle_temp: "",
    bed_temp: "",
    density: "",
    sort_order: data.materials.length,
    ace_material_type: "",
  };
}
