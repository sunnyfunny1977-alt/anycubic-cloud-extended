/**
 * The ACE box at the top of the inventory.
 *
 * What the printer reports per slot comes from its own sensors, which Home
 * Assistant pushes anyway, so this needs no polling and no extra websocket
 * traffic. Each slot entry already carries `printer_id`, `box_id` and
 * `local_slot` -- the three fields a binding is keyed by -- so a slot can be
 * bound straight from here.
 */

import { t } from "../i18n.js";
import {
  fmtNumber,
  html,
  icon,
  progressBar,
  raw,
  selectField,
  textField,
} from "../ui.js";

export const OPTION_NONE = "__none__";
export const OPTION_NEW = "__new__";

function slotColour(slot) {
  const colour = slot.color;

  if (Array.isArray(colour) && colour.length >= 3) {
    return `rgb(${Number(colour[0])},${Number(colour[1])},${Number(colour[2])})`;
  }

  return slot.color_hex || "#555";
}

function slotCard(slot, isAdmin) {
  const assignment = slot.assignment || null;
  const loaded = Boolean(slot.spool_loaded);
  const active = Boolean(slot.is_active);

  // `stale_confirmed` is this session's answer to the warning. The slot
  // sensors only carry the cleared mark on the printer's next cycle, and a
  // warning that stays put for a quarter minute after being dismissed reads
  // as a button that did not work.
  const stale = Boolean(assignment && assignment.stale && !slot.stale_confirmed);

  const grams = assignment ? assignment.remaining_grams : null;
  const percent = assignment ? assignment.remaining_percent : null;
  const low = percent !== null && percent !== undefined && percent < 10;

  return html`<div class="ace-slot ${active ? "ace-slot-active" : ""}">
    <div class="ace-slot-head">
      <span class="ace-slot-name">${t("ace.slot", { slot: slot.local_slot })}</span>
      ${active ? html`<span class="chip open">${t("ace.active")}</span>` : ""}
    </div>

    <div class="ace-slot-body">
      <span
        class="ace-dot ${loaded ? "" : "ace-dot-empty"}"
        style="background:${loaded ? slotColour(slot) : "transparent"}"
      ></span>
      <div class="grow">
        <div class="name">${loaded ? slot.material_type || "–" : t("ace.empty")}</div>
        <div class="sub hint">
          ${assignment
            ? assignment.item_label
            : html`<span class="ace-unbound">${t("ace.no_assignment")}</span>`}
        </div>
      </div>
    </div>

    ${assignment
      ? html`<div class="ace-slot-amount">
          ${progressBar(percent === undefined ? null : percent)}
          <span class="amount ${low ? "ace-low" : ""}">
            ${grams === null || grams === undefined
              ? "? g"
              : `${fmtNumber(grams)} g`}
          </span>
        </div>`
      : ""}

    ${assignment && assignment.depleted
      ? html`<div class="ace-warn">${t("ace.depleted")}</div>`
      : ""}
    ${stale
      ? html`<div class="ace-warn ace-warn-row">
          <span class="grow">${t("ace.changed")}</span>
          <button
            class="ace-warn-btn"
            data-action="confirm-slot"
            data-printer="${slot.printer_id}"
            data-box="${slot.box_id}"
            data-slot="${slot.local_slot}"
            ${raw(isAdmin ? "" : "disabled")}
          >
            ${t("ace.confirm")}
          </button>
        </div>`
      : ""}

    <div class="ace-slot-actions">
      <button
        class="btn ${assignment ? "secondary" : ""} grow"
        data-action="assign-slot"
        data-printer="${slot.printer_id}"
        data-box="${slot.box_id}"
        data-slot="${slot.local_slot}"
        data-material="${slot.material_type || ""}"
        ${raw(isAdmin ? "" : "disabled")}
      >
        ${icon(assignment ? "pencil" : "plus")}
        ${assignment ? t("ace.change") : t("ace.assign")}
      </button>

      ${assignment
        ? html`<button
            class="icon-btn danger"
            data-action="clear-slot"
            data-printer="${slot.printer_id}"
            data-box="${slot.box_id}"
            data-slot="${slot.local_slot}"
            data-label="${assignment.item_label || ""}"
            title="${t("ace.clear")}"
            aria-label="${t("ace.clear")}"
            ${raw(isAdmin ? "" : "disabled")}
          >
            ${icon("delete")}
          </button>`
        : ""}
    </div>
  </div>`;
}

/** Render every ACE box the printers report, or nothing when there are none. */
export function renderAceSection(ctx) {
  const { slots, isAdmin } = ctx;

  if (!slots || !slots.length) {
    return "";
  }

  return html`${slots.map(
    (box) => html`<div class="ace-box">
      <div class="section-title" style="margin:0 0 10px">
        <span>${box.name}</span>
      </div>
      <div class="ace-grid">
        ${box.slots.map((slot) => slotCard(slot, isAdmin))}
      </div>
    </div>`
  )}`;
}

/**
 * Body of the slot dialog: pick a roll, and optionally put it on the scale
 * first.
 *
 * Weighing is deliberately optional. The whole point of the automatic
 * deduction is that the cupboard stays roughly right without it; weighing is
 * how you correct the drift when you happen to have the scale out.
 */
export function slotDialogBody(values, context) {
  const { candidates, loading, assignment, needsTare, materialType, showingAll } =
    context;

  if (loading) {
    return html`<div class="empty">${t("app.loading")}</div>`;
  }

  const options = [
    ...(candidates || []).map((candidate) => ({
      value: `${candidate.item_id}:${candidate.spool_id || ""}`,
      label:
        candidate.spool_id === null
          ? t("ace.option_new", { label: candidate.label })
          : `${candidate.label} — ${fmtNumber(candidate.remaining_grams)} g`,
    })),
  ];

  if (assignment) {
    options.push({ value: OPTION_NONE, label: t("ace.option_release") });
  }

  const releasing = values.candidate === OPTION_NONE;
  const selected = (candidates || []).find(
    (candidate) => `${candidate.item_id}:${candidate.spool_id || ""}` === values.candidate
  );
  const tare = selected ? selected.tare_g : assignment ? assignment.tare_g : null;
  const tareUnknown = tare === null || tare === undefined;

  return html`<div class="form-grid">
    <div class="span-2">
      ${selectField({
        name: "candidate",
        label: t("ace.field_spool"),
        value: values.candidate,
        placeholder: materialType
          ? t("ace.placeholder_material", { material: materialType })
          : "—",
        options,
      })}
      ${!options.length
        ? html`<div class="hint">
            ${showingAll ? t("ace.no_candidates_at_all") : t("ace.no_candidates")}
            ${showingAll
              ? ""
              : html`<button class="btn text" data-action="slot-show-all">
                  ${t("ace.show_all")}
                </button>`}
          </div>`
        : ""}
    </div>

    ${releasing
      ? ""
      : html`<div class="span-2">
          <div class="section-title" style="margin:8px 0 4px">
            ${t("ace.section_weigh")}
          </div>
          <div class="hint">${t("ace.weigh_hint")}</div>
        </div>
        ${textField({
          name: "gross_weight_g",
          label: t("field.gross_weight"),
          type: "number",
          min: 0,
          step: 1,
          value: values.gross_weight_g,
          placeholder: tareUnknown ? "—" : "",
          disabled: tareUnknown && !values.empty_weight_g,
          title: tareUnknown
            ? t("field.gross_weight_disabled")
            : t("field.gross_weight_hint"),
        })}
        ${tareUnknown || needsTare
          ? textField({
              name: "empty_weight_g",
              label: t("field.empty_weight_short"),
              type: "number",
              min: 0,
              step: 0.1,
              value: values.empty_weight_g,
              hint: t("ace.tare_hint"),
            })
          : html`<div class="num-field">
              <div class="hint" style="padding-top:18px">
                ${t("label.empty_weight")}: ${fmtNumber(tare)} g
              </div>
            </div>`}`}
  </div>`;
}

/** Default values for the slot dialog. */
export function newSlotValues(assignment) {
  return {
    candidate: assignment ? `${assignment.item_id}:${assignment.spool_id}` : "",
    gross_weight_g: "",
    empty_weight_g: "",
  };
}
