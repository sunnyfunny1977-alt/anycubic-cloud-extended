import { CSSResult, LitElement, css, html } from "lit";
import { property } from "lit/decorators.js";

import { navigateToPage } from "../../helpers";
import { customElementIfUndef } from "../../internal/register-custom-element";
import {
  HassDevice,
  HassPanel,
  HassRoute,
  HomeAssistant,
  LitTemplateResult,
} from "../../types";

import "../../filament_panel/app.js";

/**
 * Hosts the filament inventory inside the Anycubic panel.
 *
 * The inventory views are a dependency-free web component carried over from
 * the standalone Filament Manager. Lit sets properties rather than attributes,
 * so its `set hass` / `set route` setters work untouched; the only thing that
 * had to change is who owns the URL, which is now this panel.
 */
@customElementIfUndef("anycubic-view-filament")
export class AnycubicViewFilament extends LitElement {
  @property()
  public hass!: HomeAssistant;

  @property()
  public language!: string;

  @property({ type: Boolean, reflect: true })
  public narrow!: boolean;

  @property()
  public route!: HassRoute;

  @property()
  public panel!: HassPanel;

  @property({ attribute: "selected-printer-id" })
  public selectedPrinterID: string | undefined;

  @property({ attribute: "selected-printer-device" })
  public selectedPrinterDevice: HassDevice | undefined;

  render(): LitTemplateResult {
    return html`
      <anycubic-filament-panel
        .hass=${this.hass}
        .narrow=${this.narrow}
        .route=${this.route}
        .panel=${this.panel}
        @ac-filament-navigate=${this._handleNavigate}
      ></anycubic-filament-panel>
    `;
  }

  private _handleNavigate = (ev: CustomEvent<{ view: string }>): void => {
    ev.stopPropagation();
    navigateToPage(this, `filament/${ev.detail.view}`);
  };

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
        width: 100%;
      }
    `;
  }
}
