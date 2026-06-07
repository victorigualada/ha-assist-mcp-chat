import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./assist-mcp-chat";
import type { AssistPipeline, AssistPipelineList, HomeAssistant } from "./types";

const STORAGE_KEY = "assist-mcp-chat-pipeline";

/**
 * Right-side drawer that replaces the centered Assist dialog.
 *
 * `<ha-drawer>` is Material's left drawer; setting `direction="rtl"` anchors it to
 * the right, and the content is wrapped in a `dir="ltr"` element so text layout is
 * unaffected for left-to-right users.
 */
@customElement("assist-mcp-chat-drawer")
export class AssistMcpChatDrawer extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _open = false;

  @state() private _pipelines: AssistPipeline[] = [];

  @state() private _pipelineId?: string;

  public async openDialog(params?: { pipeline_id?: string }): Promise<void> {
    this._open = true;
    await this._loadPipelines(params?.pipeline_id);
  }

  public closeDialog(): void {
    this._open = false;
  }

  private async _loadPipelines(preferred?: string): Promise<void> {
    try {
      const result = await this.hass.callWS<AssistPipelineList>({
        type: "assist_pipeline/pipeline/list",
      });
      this._pipelines = result.pipelines;
      const stored = window.localStorage.getItem(STORAGE_KEY) ?? undefined;
      this._pipelineId =
        preferred && preferred !== "last_used"
          ? preferred
          : (stored ??
            result.preferred_pipeline ??
            result.pipelines[0]?.id);
    } catch (_err) {
      this._pipelines = [];
    }
  }

  private _pipelineChanged(ev: Event): void {
    this._pipelineId = (ev.target as HTMLSelectElement).value;
    window.localStorage.setItem(STORAGE_KEY, this._pipelineId);
  }

  protected render() {
    if (!this._open) {
      return nothing;
    }
    return html`
      <ha-drawer
        type="modal"
        open
        direction="rtl"
        @MDCDrawer:closed=${this.closeDialog}
      >
        <div class="content" dir="ltr">
          <ha-header-bar>
            <ha-icon-button
              slot="navigationIcon"
              .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}
              .label=${this.hass.localize("ui.common.close")}
              @click=${this.closeDialog}
            ></ha-icon-button>
            <div slot="title">
              ${this.hass.localize("ui.dialogs.voice_command.title") ||
              "Assist"}
            </div>
            ${this._pipelines.length > 1
              ? html`
                  <select
                    slot="actionItems"
                    class="pipeline-picker"
                    @change=${this._pipelineChanged}
                  >
                    ${this._pipelines.map(
                      (pipeline) => html`
                        <option
                          value=${pipeline.id}
                          ?selected=${pipeline.id === this._pipelineId}
                        >
                          ${pipeline.name}
                        </option>
                      `
                    )}
                  </select>
                `
              : nothing}
          </ha-header-bar>
          <assist-mcp-chat
            .hass=${this.hass}
            .pipelineId=${this._pipelineId}
          ></assist-mcp-chat>
        </div>
      </ha-drawer>
    `;
  }

  static styles = css`
    :host {
      --mdc-drawer-width: min(100vw, 500px);
    }
    .content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    ha-header-bar {
      --mdc-theme-on-primary: var(--primary-text-color);
      --mdc-theme-primary: var(--primary-background-color);
      border-bottom: 1px solid var(--divider-color);
      flex: 0 0 auto;
    }
    assist-mcp-chat {
      flex: 1;
      min-height: 0;
    }
    .pipeline-picker {
      max-width: 180px;
      margin: 0 8px;
      background-color: var(--card-background-color);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-border-radius-md, 8px);
      padding: 6px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "assist-mcp-chat-drawer": AssistMcpChatDrawer;
  }
}
