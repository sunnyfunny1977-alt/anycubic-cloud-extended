import { CSSResult, LitElement, PropertyValues, css, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { query } from "lit/decorators/query.js";
import { map } from "lit/directives/map.js";
import { styleMap } from "lit/directives/style-map.js";
import { animate, Options as motionOptions } from "@lit-labs/motion";

import { localize } from "../../../../localize/localize";

import "../../../lib/colorpicker/ColorPicker.js";

import { platform } from "../../../const";
import { HASSDomEvent } from "../../../fire_event";
import { customElementIfUndef } from "../../../internal/register-custom-element";

import {
  assignSlot,
  clearSlot,
  slotCandidates,
  subscribeFilament,
  weighSlot,
} from "../../../data/filament_store";
import { materialTypeFromString } from "../../../helpers";
import {
  AnycubicMaterialType,
  AnycubicSlotAssignment,
  AnycubicSpoolCandidate,
  AnycubicSpoolInfo,
  ColorPicker,
  ColourPickEvent,
  DomClickEvent,
  DropdownEvent,
  EvtTargColourPreset,
  HassDevice,
  HomeAssistant,
  LitTemplateResult,
  ModalEventSpool,
} from "../../../types";

import { commonModalStyle } from "../../ui/modal-styles";

import "../../ui/select-dropdown.ts";

// Keys of the two synthetic dropdown entries. Real candidates are keyed
// "<item_id>:<spool_id>", which can never collide with these.
const OPTION_NONE = "__none__";
const OPTION_NEW = "__new__";
const DROPDOWN_MATERIAL = "material";
const DROPDOWN_SPOOL = "spool";

const animOptionsCard: motionOptions = {
  keyframeOptions: {
    duration: 250,
    direction: "alternate",
    easing: "ease-in-out",
  },
  properties: ["height", "opacity", "scale"],
};

@customElementIfUndef("anycubic-printercard-multicolorbox_modal_spool")
export class AnycubicPrintercardMulticolorboxModalSpool extends LitElement {
  @query("color-picker")
  private _elColorPicker: ColorPicker | undefined;

  @property()
  public hass!: HomeAssistant;

  @property()
  public language!: string;

  @property({ attribute: "selected-printer-device" })
  public selectedPrinterDevice: HassDevice | undefined;

  @property({ attribute: "slot-colors" })
  public slotColors?: string[];

  @state()
  private box_id: number = 0;

  @state()
  private spoolList: AnycubicSpoolInfo[] = [];

  @state()
  private spool_index: number = -1;

  @state()
  private display_slot: number = -1;

  @state()
  private material_type: AnycubicMaterialType | undefined;

  @state()
  private color: number[] | string | undefined;

  @state()
  private _isOpen: boolean = false;

  @state()
  private _heading: string;

  @state()
  private _labelSelectMaterial: string;

  @state()
  private _labelSelectColour: string;

  @state()
  private _buttonSave: string;

  @state()
  private _changingSlot: boolean = false;

  @property({ attribute: "allow-spool-assignment", type: Boolean })
  public allowSpoolAssignment: boolean = true;

  @state()
  private local_slot: number = -1;

  @state()
  private printer_id: string | undefined;

  @state()
  private source: string | undefined;

  @state()
  private sku: string | undefined;

  @state()
  private _assignment: AnycubicSlotAssignment | null = null;

  @state()
  private _candidates: AnycubicSpoolCandidate[] = [];

  @state()
  private _candidateOptions: Record<string, string> = {};

  @state()
  private _selectedCandidateKey: string | undefined;

  @state()
  private _grossWeight: string = "";

  @state()
  private _tareInput: string = "";

  @state()
  private _needsTare: boolean = false;

  @state()
  private _canWrite: boolean = true;

  @state()
  private _materialMismatch: boolean = false;

  @state()
  private _spoolError: string = "";

  @state()
  private _changingSpool: boolean = false;

  // Set as soon as the user touches the roll dropdown or the weight field.
  // Picking a colour normally submits and closes the dialog straight away,
  // which would throw away a half-entered weight.
  @state()
  private _formDirty: boolean = false;

  private _unsubFilament: (() => void) | null = null;
  private _candidateTimer: number | undefined;

  @state()
  private _labelSelectSpool: string;

  @state()
  private _labelGrossWeight: string;

  @state()
  private _labelTare: string;

  @state()
  private _labelTareHint: string;

  @state()
  private _labelPresetColour: string;

  @state()
  private _buttonAssignAndWeigh: string;

  @state()
  private _optionNewSpool: string;

  @state()
  private _optionNoAssignment: string;

  @state()
  private _labelMaterialMismatch: string;

  // eslint-disable-next-line @typescript-eslint/require-await
  async firstUpdated(): Promise<void> {
    this.addEventListener("click", (e) => {
      this._closeModal(e);
    });
    this.addEventListener("ac-select-dropdown", this._handleDropdownEvent);
    this.addEventListener("colorchanged", this._handleColourEvent);
    this.addEventListener("colorpicked", this._handleColourPickEvent);
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this.parentElement?.addEventListener(
      "ac-mcb-modal",
      this._handleModalEvent,
    );
  }

  public disconnectedCallback(): void {
    this.parentElement?.removeEventListener(
      "ac-mcb-modal",
      this._handleModalEvent,
    );
    if (this._unsubFilament) {
      this._unsubFilament();
      this._unsubFilament = null;
    }
    super.disconnectedCallback();
  }

  protected willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has("language")) {
      this._heading = localize("card.spool_settings.heading", this.language);
      this._labelSelectMaterial = localize(
        "card.spool_settings.label_select_material",
        this.language,
      );
      this._labelSelectColour = localize(
        "card.spool_settings.label_select_colour",
        this.language,
      );
      this._buttonSave = localize("common.actions.save", this.language);
      this._labelSelectSpool = localize(
        "card.spool_settings.label_select_spool",
        this.language,
      );
      this._labelGrossWeight = localize(
        "card.spool_settings.label_gross_weight",
        this.language,
      );
      this._labelTare = localize(
        "card.spool_settings.label_tare",
        this.language,
      );
      this._labelTareHint = localize(
        "card.spool_settings.tare_hint",
        this.language,
      );
      this._labelPresetColour = localize(
        "card.spool_settings.label_preset_colour",
        this.language,
      );
      this._buttonAssignAndWeigh = localize(
        "card.spool_settings.button_assign_and_weigh",
        this.language,
      );
      this._optionNewSpool = localize(
        "card.spool_settings.option_new_spool",
        this.language,
      );
      this._optionNoAssignment = localize(
        "card.spool_settings.option_no_assignment",
        this.language,
      );
      this._labelMaterialMismatch = localize(
        "card.spool_settings.material_mismatch",
        this.language,
      );
    }
  }

  protected update(changedProperties: PropertyValues<this>): void {
    super.update(changedProperties);
    if (this._isOpen) {
      this.style.display = "block";
    } else {
      this.style.display = "none";
    }
  }

  render(): LitTemplateResult {
    const stylesMain = {
      height: "auto",
      opacity: 1.0,
      scale: 1.0,
    };

    return html`
      <div
        class="ac-modal-container"
        style=${styleMap(stylesMain)}
        ${animate({ ...animOptionsCard })}
      >
        <span class="ac-modal-close" @click=${this._closeModal}>&times;</span>
        <div class="ac-modal-card" @click=${this._cardClick}>
          ${this.color ? this._renderCard() : nothing}
        </div>
      </div>
    `;
  }

  _renderCard(): LitTemplateResult {
    return this.spool_index >= 0
      ? html`
          <div>
            <div class="ac-slot-title">
              ${this._heading}:
              ${this.display_slot > 0
                ? this.display_slot
                : this.spool_index + 1}
            </div>
            <div>
              <div>
                <p class="ac-modal-label">${this._labelSelectMaterial}:</p>
                <anycubic-ui-select-dropdown
                  .dropdownId=${DROPDOWN_MATERIAL}
                  .availableOptions=${AnycubicMaterialType}
                  .placeholder=${AnycubicMaterialType.PLA}
                  .initialItem=${this.material_type}
                ></anycubic-ui-select-dropdown>
              </div>
              ${this._renderPresets()}
              <div>
                <p class="ac-modal-label">${this._labelSelectColour}:</p>
                <color-picker .value=${this.color}></color-picker>
              </div>
              ${this._renderInventory()}
            </div>
            <div class="ac-save-settings">
              <ha-control-button
                .disabled=${this._changingSlot}
                @click=${this._handleSaveButton}
              >
                ${this._buttonSave}
              </ha-control-button>
              ${this.allowSpoolAssignment
                ? html`
                    <ha-control-button
                      .disabled=${this._changingSpool || !this._canWrite}
                      @click=${this._handleAssignAndWeigh}
                    >
                      ${this._buttonAssignAndWeigh}
                    </ha-control-button>
                  `
                : nothing}
            </div>
          </div>
        `
      : nothing;
  }

  private _renderPresets(): LitTemplateResult {
    return html`
      <div>
        <p class="ac-modal-label">${this._labelPresetColour}:</p>
        <div class="ac-mcb-presets">
          ${this.slotColors
            ? map(this.slotColors, (preset, _index) => {
                const presetStyle = {
                  "background-color": preset,
                };
                return html`
                  <div
                    class="ac-mcb-preset-color"
                    style=${styleMap(presetStyle)}
                    .preset=${preset}
                    @click=${this._colourPresetChange}
                  >
                    &nbsp;
                  </div>
                `;
              })
            : nothing}
        </div>
      </div>
    `;
  }

  /**
   * The inventory half of the dialog: which roll is in this slot and what it
   * weighs. Rendered below the colour picker so the existing printer settings
   * keep their familiar position.
   */
  private _renderInventory(): LitTemplateResult {
    if (!this.allowSpoolAssignment) {
      return nothing as unknown as LitTemplateResult;
    }

    const selected = this._selectedCandidate();
    const releasing = this._selectedCandidateKey === OPTION_NONE;
    const tare = selected
      ? selected.tare_g
      : (this._assignment?.tare_g ?? null);
    const gross = parseFloat(this._grossWeight);
    const tareValue = tare === null ? parseFloat(this._tareInput) : tare;
    const net =
      !isNaN(gross) && !isNaN(tareValue)
        ? Math.max(0, gross - tareValue)
        : null;
    const netPercent =
      net !== null && selected && selected.net_weight_g > 0
        ? Math.round((net / selected.net_weight_g) * 100)
        : null;

    return html`
      <div class="ac-fm-section">
        <p class="ac-modal-label">${this._labelSelectSpool}:</p>
        <anycubic-ui-select-dropdown
          .dropdownId=${DROPDOWN_SPOOL}
          .availableOptions=${this._candidateOptions}
          .placeholder=${this._optionNoAssignment}
          .initialItem=${this._selectedCandidateKey
            ? this._candidateOptions[this._selectedCandidateKey]
            : undefined}
        ></anycubic-ui-select-dropdown>

        ${this._materialMismatch
          ? html`<div class="ac-fm-warn">${this._labelMaterialMismatch}</div>`
          : nothing}
        ${releasing
          ? nothing
          : html` <p class="ac-modal-label">${this._labelGrossWeight}:</p>
              <ha-textfield
                .value=${this._grossWeight}
                .type=${"number"}
                .min=${0}
                .max=${100000}
                .step=${1}
                .suffix=${"g"}
                .disabled=${!this._canWrite}
                @input=${this._handleGrossInput}
              ></ha-textfield>`}
        ${!releasing && (tare === null || this._needsTare) && selected
          ? html`
              <div class="ac-fm-tare">
                <p class="ac-modal-label">${this._labelTare}:</p>
                <ha-textfield
                  .value=${this._tareInput}
                  .type=${"number"}
                  .min=${0}
                  .max=${100000}
                  .step=${1}
                  .suffix=${"g"}
                  .disabled=${!this._canWrite}
                  @input=${this._handleTareInput}
                ></ha-textfield>
                <div class="ac-fm-hint">${this._labelTareHint}</div>
              </div>
            `
          : nothing}
        ${net !== null && !releasing
          ? html`
              <div class="ac-fm-preview">
                = ${Math.round(net)}
                g${netPercent === null ? "" : ` (${netPercent} %)`}
              </div>
            `
          : nothing}
        ${this._spoolError
          ? html`<div class="ac-fm-error">${this._spoolError}</div>`
          : nothing}
      </div>
    `;
  }

  private _selectedCandidate(): AnycubicSpoolCandidate | undefined {
    if (
      !this._selectedCandidateKey ||
      this._selectedCandidateKey === OPTION_NONE
    ) {
      return undefined;
    }
    return this._candidates.find(
      (c) => this._candidateKey(c) === this._selectedCandidateKey,
    );
  }

  private _candidateKey(candidate: AnycubicSpoolCandidate): string {
    return candidate.spool_id
      ? `${candidate.item_id}:${candidate.spool_id}`
      : `${OPTION_NEW}:${candidate.item_id}`;
  }

  private _colourPresetChange = (
    ev: DomClickEvent<EvtTargColourPreset>,
  ): void => {
    this.color = ev.currentTarget.preset;
    if (this._elColorPicker) {
      this._elColorPicker.color = this.color;
    }
  };

  private _handleModalEvent = (evt: Event): void => {
    const e = evt as HASSDomEvent<ModalEventSpool>;
    e.stopPropagation();
    if (e.detail.modalOpen) {
      this._isOpen = true;
      this.box_id = Number(e.detail.box_id);
      this.spool_index = Number(e.detail.spool_index);
      this.display_slot = Number(e.detail.display_slot ?? this.spool_index + 1);
      this.material_type = materialTypeFromString(e.detail.material_type);
      this.color = e.detail.color;
      this.local_slot = Number(e.detail.local_slot ?? this.spool_index + 1);
      this.printer_id = e.detail.printer_id;
      this.source = e.detail.source;
      this.sku = e.detail.sku;
      this._assignment = e.detail.assignment ?? null;
      this._startFilament();
    }
  };

  /**
   * Open the inventory subscription and pull the rolls that fit this slot.
   *
   * The subscription lives only as long as the dialog: the slot tiles read
   * everything they display from entity attributes, so an idle dashboard —
   * possibly with several cards on it — opens no connection at all.
   */
  private _startFilament(): void {
    if (!this.allowSpoolAssignment) {
      return;
    }
    if (!this._unsubFilament) {
      this._unsubFilament = subscribeFilament(this.hass, () => {
        // The inventory changed elsewhere (a roll consumed, a weight typed in
        // the Filament tab). Re-read rather than render a stale list.
        void this._loadCandidates();
      });
    }
    void this._loadCandidates();
  }

  private _slotRef():
    | { printer_id: string; box_id: number; local_slot: number }
    | undefined {
    if (!this.printer_id || this.local_slot < 1) {
      return undefined;
    }
    return {
      printer_id: this.printer_id,
      box_id: this.box_id,
      local_slot: this.local_slot,
    };
  }

  private async _loadCandidates(): Promise<void> {
    const slot = this._slotRef();
    if (!slot) {
      return;
    }
    try {
      const result = await slotCandidates(
        this.hass,
        slot,
        this.material_type as string | undefined,
      );
      this._candidates = result.candidates;
      this._assignment = result.assignment;
      this._canWrite = result.can_write;
      this._spoolError = "";

      const options: Record<string, string> = {
        [OPTION_NONE]: this._optionNoAssignment,
      };
      for (const candidate of result.candidates) {
        const remaining =
          candidate.remaining_grams === null
            ? "? g"
            : `${Math.round(candidate.remaining_grams)} g`;
        const percent =
          candidate.remaining_percent === null
            ? ""
            : ` (${Math.round(candidate.remaining_percent)} %)`;
        const prefix = candidate.spool_id ? "" : `${this._optionNewSpool} — `;
        options[this._candidateKey(candidate)] =
          `${prefix}${candidate.label} — ${remaining}${percent}`;
      }
      this._candidateOptions = options;

      // Keep the current binding selected when it is still on offer, so
      // reopening the dialog shows what is actually in the slot.
      if (result.assignment) {
        const key = `${result.assignment.item_id}:${result.assignment.spool_id}`;
        if (key in options) {
          this._selectedCandidateKey = key;
          this._materialMismatch = false;
        } else if (!this._formDirty) {
          // The bound roll no longer matches the material the slot reports.
          this._selectedCandidateKey = undefined;
          this._materialMismatch = true;
        }
      }
    } catch (err: unknown) {
      this._spoolError = this._errorText(err);
    }
  }

  private _errorText(err: unknown): string {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    if (code) {
      const translated = localize(
        `card.spool_settings.errors.${code}`,
        this.language,
      );
      if (translated && !translated.includes("card.spool_settings")) {
        return translated;
      }
    }
    return err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err);
  }

  private _handleDropdownEvent = (evt: Event): void => {
    const e = evt as HASSDomEvent<DropdownEvent<string, string>>;
    e.stopPropagation();

    // `ac-select-dropdown` bubbles to this host from every dropdown in the
    // dialog. The id says which one; the default branch keeps every other
    // user of the component (which sends no id) working unchanged.
    switch (e.detail.dropdownId) {
      case DROPDOWN_SPOOL:
        this._formDirty = true;
        this._materialMismatch = false;
        this._selectedCandidateKey = e.detail.key;
        return;
      case DROPDOWN_MATERIAL:
      default:
        if (e.detail.value) {
          this.material_type = materialTypeFromString(e.detail.value);
          this._debouncedReload();
        }
    }
  };

  /**
   * Changing the material narrows the roll list. Debounced because the
   * dropdown can fire several times while the user scans through it.
   */
  private _debouncedReload(): void {
    if (this._candidateTimer) {
      clearTimeout(this._candidateTimer);
    }
    this._candidateTimer = window.setTimeout(() => {
      this._candidateTimer = undefined;
      void this._loadCandidates();
    }, 150);
  }

  private _handleGrossInput = (ev: Event): void => {
    this._grossWeight = (ev.currentTarget as HTMLInputElement).value;
    this._formDirty = true;
  };

  private _handleTareInput = (ev: Event): void => {
    this._tareInput = (ev.currentTarget as HTMLInputElement).value;
    this._formDirty = true;
  };

  /**
   * Bind the roll and, when a weight was typed, book it.
   *
   * Kept separate from Save: that one talks to the printer, this one to the
   * inventory. They can fail independently and need their own error message.
   */
  private _handleAssignAndWeigh = (): void => {
    const slot = this._slotRef();
    if (!slot || this._changingSpool) {
      return;
    }

    if (this._selectedCandidateKey === OPTION_NONE) {
      this._changingSpool = true;
      clearSlot(this.hass, slot)
        .then(() => {
          this._changingSpool = false;
          this._closeModal();
        })
        .catch((err: unknown) => {
          this._changingSpool = false;
          this._spoolError = this._errorText(err);
        });
      return;
    }

    const candidate = this._selectedCandidate();
    if (!candidate) {
      return;
    }

    this._changingSpool = true;
    this._spoolError = "";

    // Written from the dialog's own values so the change the user just made
    // is not immediately reported back as "the spool was swapped".
    const fingerprint = {
      fp_material_type: (this.material_type as string | undefined) ?? "",
      fp_color_hex: this._colorHex(),
      fp_sku: this.sku ?? "",
    };

    assignSlot(
      this.hass,
      slot,
      candidate.item_id,
      candidate.spool_id,
      fingerprint,
    )
      .then(async () => {
        const gross = parseFloat(this._grossWeight);
        if (isNaN(gross)) {
          return;
        }
        const tare = parseFloat(this._tareInput);
        await weighSlot(this.hass, slot, gross, isNaN(tare) ? null : tare);
      })
      .then(() => {
        this._changingSpool = false;
        this._closeModal();
      })
      .catch((err: unknown) => {
        this._changingSpool = false;
        this._spoolError = this._errorText(err);
        // `no_empty_weight` is the backend asking for the tare; showing the
        // field is more useful than just repeating the error.
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: unknown }).code === "no_empty_weight"
        ) {
          this._needsTare = true;
        }
      });
  };

  private _colorHex(): string {
    if (typeof this.color === "string") {
      return this.color.toUpperCase();
    }
    if (Array.isArray(this.color) && this.color.length >= 3) {
      return `#${this.color
        .slice(0, 3)
        .map((c) => Number(c).toString(16).padStart(2, "0"))
        .join("")}`.toUpperCase();
    }
    return "";
  }

  private _handleColourEvent = (evt: Event): void => {
    const e = evt as HASSDomEvent<ColourPickEvent>;
    e.stopPropagation();
    if (e.detail.color) {
      this.color = e.detail.color.rgb;
    }
  };

  private _handleColourPickEvent = (e: Event): void => {
    this._handleColourEvent(e);
    // Picking a colour used to submit and close immediately. That is still the
    // quick path for a plain colour correction, but it must not fire once the
    // user has started filling in the roll or its weight.
    if (!this._changingSlot && !this._formDirty) {
      this._submitSlotChanges();
    }
  };

  private _handleSaveButton = (): void => {
    this._submitSlotChanges();
  };

  private _submitSlotChanges(): void {
    if (
      this.selectedPrinterDevice &&
      this.material_type &&
      this.spool_index >= 0 &&
      this.color &&
      this.color.length >= 3
    ) {
      const serv = `multi_color_box_set_slot_${this.material_type.toLowerCase()}`;
      this._changingSlot = true;
      this.hass
        .callService(platform, serv, {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          box_id: this.box_id,
          slot_number: this.spool_index + 1,
          slot_color_red: this.color[0],
          slot_color_green: this.color[1],
          slot_color_blue: this.color[2],
        })
        .then(() => {
          this._changingSlot = false;
        })
        .catch((_e: unknown) => {
          this._changingSlot = false;
        });
      this._closeModal();
    }
  }

  private _closeModal = (e?: Event | undefined): void => {
    if (e) {
      e.stopPropagation();
    }
    this._isOpen = false;
    this.spool_index = -1;
    this.display_slot = -1;
    this.material_type = undefined;
    this.color = undefined;
    this.box_id = 0;

    // Everything below is per slot. Leaving any of it behind would show the
    // previous slot's roll and weight the next time the dialog opens.
    this.local_slot = -1;
    this.printer_id = undefined;
    this.source = undefined;
    this.sku = undefined;
    this._assignment = null;
    this._candidates = [];
    this._candidateOptions = {};
    this._selectedCandidateKey = undefined;
    this._grossWeight = "";
    this._tareInput = "";
    this._needsTare = false;
    this._materialMismatch = false;
    this._spoolError = "";
    this._formDirty = false;

    if (this._candidateTimer) {
      clearTimeout(this._candidateTimer);
      this._candidateTimer = undefined;
    }
    if (this._unsubFilament) {
      this._unsubFilament();
      this._unsubFilament = null;
    }
  };

  private _cardClick = (e: Event): void => {
    e.stopPropagation();
  };

  static get styles(): CSSResult {
    return css`
      ${commonModalStyle}

      .ac-slot-title {
        font-size: 24px;
        text-align: center;
        font-weight: 600;
      }

      .ac-fm-section {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--divider-color, #4444);
      }

      .ac-fm-section ha-textfield {
        width: 100%;
      }

      .ac-fm-preview {
        margin-top: 6px;
        font-weight: 700;
        text-align: right;
      }

      .ac-fm-hint {
        font-size: 12px;
        opacity: 0.75;
        margin-top: 4px;
      }

      .ac-fm-tare {
        margin-top: 8px;
        padding: 8px;
        border-radius: 8px;
        background: var(--warning-color, #ffa600);
        color: #222;
      }

      .ac-fm-warn {
        margin-top: 6px;
        font-size: 12px;
        color: var(--warning-color, #ffa600);
      }

      .ac-fm-error {
        margin-top: 6px;
        font-size: 12px;
        color: var(--error-color, #db4437);
      }

      .ac-mcb-presets {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
      }

      .ac-mcb-preset-color {
        width: 30px;
        height: 30px;
        border-radius: 15px;
        margin: 20px 10px;
      }

      ha-control-button {
        min-width: 150px;
        margin: 30px auto 0px;
        font-size: 14px;
      }

      color-picker {
        --font-fam: var(--token-font-family-primary);
        --bg-color: var(--ha-card-background);
        --label-color: var(--secondary-text-color);
        --form-border-color: var(--ha-card-background);
        --input-active-border-color: var(--primary-color);
        --input-bg: var(--primary-background-color);
        --input-active-bg: var(--ha-card-background);
        --input-color: var(--secondary-text-color);
        --input-active-color: var(--primary-text-color);
        --input-active-box-shadow: 0 2px 5px #ccc;
        --button-active-bg: var(--state-active-color);
        --button-active-color: var(--token-color-icon-primary);
        --outer-box-shadow: 0 4px 12px #111;
      }
    `;
  }
}
