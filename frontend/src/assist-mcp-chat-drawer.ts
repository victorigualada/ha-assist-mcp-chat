import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./assist-mcp-chat";
import {
  mdiChevronDown,
  mdiChevronRight,
  mdiClose,
  mdiCog,
  mdiStar,
} from "@mdi/js";
import {
  type ChatSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "./settings";
import { popover, tokens } from "./shared-styles";
import type {
  AssistPipeline,
  AssistPipelineList,
  HomeAssistant,
} from "./types";

const STORAGE_KEY = "assist-mcp-chat-pipeline";

/**
 * Modal chat surface that replaces the centered Assist dialog.
 *
 * On wide viewports it slides in as a right-side panel; on narrow (mobile)
 * viewports it slides up as a bottom sheet, mirroring how the native Assist
 * dialog presents per platform. It renders its own backdrop and panel rather
 * than wrapping `<ha-drawer>` so that open/close is fully under our control and
 * not tied to that component's version-dependent internals (the migration off
 * MDC, for instance, renamed its close event and broke reopening).
 */
@customElement("assist-mcp-chat-drawer")
export class AssistMcpChatDrawer extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _open = false;

  @state() private _pipelines: AssistPipeline[] = [];

  @state() private _pipelineId?: string;

  @state() private _preferredPipeline: string | null = null;

  @state() private _settings: ChatSettings = { ...DEFAULT_SETTINGS };

  @state() private _settingsOpen = false;

  @state() private _pipelineMenuOpen = false;

  public async openDialog(params?: { pipeline_id?: string }): Promise<void> {
    this._open = true;
    this._loadSettings();
    const stored = window.localStorage.getItem(STORAGE_KEY) || undefined;
    // "last_used"/"preferred" are sentinels HA's Assist entry points pass when no
    // concrete pipeline is chosen; fall back to the drawer's own remembered pick.
    const id = params?.pipeline_id;
    this._pipelineId =
      id && id !== "last_used" && id !== "preferred" ? id : stored;
    await this._loadPipelines();
    // Focus the composer once the panel has rendered (after the open animation
    // starts); the rAF lets layout settle so the input is focusable.
    await this.updateComplete;
    requestAnimationFrame(() => this._focusInput());
  }

  private _focusInput(): void {
    const chat = this.shadowRoot?.querySelector("assist-mcp-chat") as
      | (HTMLElement & { focusInput?: () => void })
      | null;
    chat?.focusInput?.();
  }

  public closeDialog(): void {
    this._open = false;
    this._settingsOpen = false;
    this._pipelineMenuOpen = false;
  }

  private _loadSettings(): void {
    this._settings = loadSettings();
  }

  private _setSetting<K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K],
  ): void {
    this._settings = { ...this._settings, [key]: value };
    saveSettings(this._settings);
  }

  private _toggleSettings(): void {
    this._settingsOpen = !this._settingsOpen;
  }

  private _handleKeyDown(ev: KeyboardEvent): void {
    if (ev.key !== "Escape") {
      return;
    }
    ev.stopPropagation();
    // Escape backs out of an open popover first, otherwise closes the drawer.
    if (this._settingsOpen || this._pipelineMenuOpen) {
      this._settingsOpen = false;
      this._pipelineMenuOpen = false;
    } else {
      this.closeDialog();
    }
  }

  private get _currentPipelineName(): string {
    const id = this._pipelineId ?? this._preferredPipeline ?? undefined;
    return (
      this._pipelines.find((p) => p.id === id)?.name ||
      this.hass.localize("ui.dialogs.voice_command.title") ||
      "Assist"
    );
  }

  private _selectPipeline(id: string): void {
    this._setPipeline(id === this._preferredPipeline ? undefined : id);
    this._pipelineMenuOpen = false;
  }

  private _manageAssistants(): void {
    // SPA navigation: mirror HA's navigate() helper so the router intercepts it.
    this.closeDialog();
    const path = "/config/voice-assistants/assistants";
    window.history.pushState(null, "", path);
    window.dispatchEvent(
      new CustomEvent("location-changed", { detail: { replace: false } }),
    );
  }

  private async _loadPipelines(): Promise<void> {
    try {
      const result = await this.hass.callWS<AssistPipelineList>({
        type: "assist_pipeline/pipeline/list",
      });
      this._pipelines = result.pipelines;
      this._preferredPipeline = result.preferred_pipeline;
    } catch (_err) {
      this._pipelines = [];
    }
  }

  // A pipeline id, or undefined to mean "Preferred".
  private _setPipeline(value?: string): void {
    this._pipelineId = value;
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  protected render() {
    if (!this._open) {
      return nothing;
    }
    return html`
      <div
        class="backdrop"
        @click=${this._onBackdropClick}
        @keydown=${this._handleKeyDown}
      >
        <div class="content" dir="ltr" role="dialog" aria-modal="true">
          <header class="bar">
            <ha-icon-button
              class="close"
              .path=${mdiClose}
              .label=${this.hass.localize("ui.common.close")}
              @click=${this.closeDialog}
            ></ha-icon-button>
            <div class="title">
              <div class="title-row">
                <span class="title-main"
                  >${
                    this.hass.localize("ui.dialogs.voice_command.title") ||
                    "Assist"
                  }</span
                >
                <span class="title-sub">MCP</span>
              </div>
              ${this._renderPipelineTrigger()}
            </div>
            <ha-icon-button
              class="cog ${this._settingsOpen ? "active" : ""}"
              .path=${mdiCog}
              .label=${"Settings"}
              aria-haspopup="dialog"
              aria-expanded=${this._settingsOpen}
              @click=${this._toggleSettings}
            ></ha-icon-button>
          </header>
          ${this._pipelineMenuOpen ? this._renderPipelineMenu() : nothing}
          ${this._settingsOpen ? this._renderSettings() : nothing}
          <assist-mcp-chat
            .hass=${this.hass}
            .pipelineId=${this._pipelineId}
            .showActivity=${this._settings.showActivity}
          ></assist-mcp-chat>
        </div>
      </div>
    `;
  }

  // Clicking the dimmed area outside the panel dismisses, like the native dialog.
  private _onBackdropClick(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) {
      this.closeDialog();
    }
  }

  // Compact dropdown trigger under the title, mirroring core Assist's dialog.
  private _renderPipelineTrigger(): TemplateResult | typeof nothing {
    if (!this._pipelines.length) {
      return nothing;
    }
    return html`
      <button
        class="pipeline-trigger"
        aria-haspopup="menu"
        aria-expanded=${this._pipelineMenuOpen}
        @click=${() => (this._pipelineMenuOpen = !this._pipelineMenuOpen)}
      >
        <span class="pipeline-name">${this._currentPipelineName}</span>
        <svg class="caret" viewBox="0 0 24 24" aria-hidden="true">
          <path d=${mdiChevronDown}></path>
        </svg>
      </button>
    `;
  }

  private _renderPipelineMenu(): TemplateResult {
    const activeId = this._pipelineId ?? this._preferredPipeline ?? undefined;
    return html`
      <div class="scrim" @click=${() => (this._pipelineMenuOpen = false)}></div>
      <div class="popover menu" role="menu" aria-label="Assistant">
        ${this._pipelines.map(
          (pipeline) => html`
            <button
              class="menu-item ${pipeline.id === activeId ? "selected" : ""}"
              role="menuitemradio"
              aria-checked=${pipeline.id === activeId}
              @click=${() => this._selectPipeline(pipeline.id)}
            >
              <span class="menu-label">${pipeline.name}</span>
              ${
                pipeline.id === this._preferredPipeline
                  ? html`<svg class="star" viewBox="0 0 24 24" aria-hidden="true">
                    <path d=${mdiStar}></path>
                  </svg>`
                  : nothing
              }
            </button>
          `,
        )}
        ${
          this.hass.user?.is_admin
            ? html`
              <div class="menu-divider"></div>
              <button
                class="menu-item manage"
                role="menuitem"
                @click=${this._manageAssistants}
              >
                <span class="menu-label"
                  >${
                    this.hass.localize(
                      "ui.dialogs.voice_command.manage_assistants",
                    ) || "Manage assistants"
                  }</span
                >
                <svg class="next" viewBox="0 0 24 24" aria-hidden="true">
                  <path d=${mdiChevronRight}></path>
                </svg>
              </button>
            `
            : nothing
        }
      </div>
    `;
  }

  private _renderSettings(): TemplateResult {
    return html`
      <div class="scrim" @click=${() => (this._settingsOpen = false)}></div>
      <div class="popover settings" role="dialog" aria-label="Settings">
        <div class="settings-head">Settings</div>
        ${this._renderToggle(
          "showActivity",
          "Show model activity",
          "Reasoning and the tools the model calls, with their arguments and results.",
        )}
        ${this._renderToggle(
          "shortcutOverride",
          "Open with the A key",
          "Override Home Assistant's Assist shortcut. When off, the chat opens with K and A keeps its default behavior.",
        )}
      </div>
    `;
  }

  private _renderToggle(
    key: keyof ChatSettings,
    label: string,
    description: string,
  ): TemplateResult {
    const checked = this._settings[key];
    return html`
      <div
        class="setting"
        @click=${(ev: Event) => {
          // Let the switch handle clicks on itself (and keyboard); a click
          // anywhere else on the row toggles the same setting.
          if ((ev.target as HTMLElement).closest("ha-switch")) {
            return;
          }
          this._setSetting(key, !checked);
        }}
      >
        <div class="setting-text">
          <span class="setting-label">${label}</span>
          <span class="setting-desc">${description}</span>
        </div>
        <ha-switch
          .checked=${checked}
          @change=${(ev: Event) =>
            this._setSetting(key, (ev.target as HTMLInputElement).checked)}
        ></ha-switch>
      </div>
    `;
  }

  static styles = [
    tokens,
    popover,
    css`
      :host {
        display: contents;
      }
      /* Full-viewport modal layer that dims the app and anchors the panel. */
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        justify-content: flex-end;
        background-color: rgba(0, 0, 0, 0.46);
        animation: amc-backdrop 180ms ease-out both;
      }
      .content {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        width: min(100vw, 680px);
        overflow: hidden;
        background-color: var(--card-background-color);
        box-shadow: -8px 0 28px rgba(0, 0, 0, 0.28);
        animation: amc-panel-side 240ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
      }
      @keyframes amc-backdrop {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes amc-panel-side {
        from {
          transform: translateX(100%);
        }
        to {
          transform: none;
        }
      }
      /* Mobile: a bottom sheet that slides up, like the native Assist dialog. */
      @media (max-width: 640px) {
        .backdrop {
          justify-content: stretch;
          align-items: flex-end;
        }
        .content {
          width: 100%;
          height: 92vh;
          max-height: 92vh;
          border-top-left-radius: var(--ha-border-radius-xl, 16px);
          border-top-right-radius: var(--ha-border-radius-xl, 16px);
          box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.28);
          animation-name: amc-panel-sheet;
        }
      }
      @keyframes amc-panel-sheet {
        from {
          transform: translateY(100%);
        }
        to {
          transform: none;
        }
      }
      .bar {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 0 0 auto;
        box-sizing: border-box;
        min-height: 64px;
        padding: 8px 12px 8px 6px;
        border-bottom: 1px solid var(--divider-color);
      }
      .close {
        flex: 0 0 auto;
        color: var(--primary-text-color);
        --mdc-icon-button-size: 40px;
        --mdc-icon-size: 22px;
      }
      .title {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1px;
      }
      .title-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
      .title-main {
        font-size: var(--ha-font-size-xl, 1.25rem);
        font-weight: var(--ha-font-weight-medium, 500);
        letter-spacing: -0.01em;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .title-sub {
        flex: 0 0 auto;
        font-family: var(
          --ha-font-family-code,
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace
        );
        font-size: var(--ha-font-size-xs, 0.7rem);
        font-weight: var(--ha-font-weight-medium, 500);
        letter-spacing: 0.08em;
        color: var(--secondary-text-color);
        padding: 2px 6px;
        border: 1px solid var(--divider-color);
        border-radius: var(--ha-border-radius-sm, 6px);
        line-height: 1.2;
      }
      assist-mcp-chat {
        flex: 1;
        min-height: 0;
      }

      /* Compact pipeline dropdown (matches core Assist's dialog) ----------- */
      .pipeline-trigger {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        align-self: flex-start;
        max-width: 100%;
        margin-left: -6px;
        padding: 2px 6px;
        border: none;
        background: none;
        border-radius: var(--ha-border-radius-sm, 6px);
        color: var(--secondary-text-color);
        font: inherit;
        font-size: var(--ha-font-size-m, 0.9rem);
        cursor: pointer;
      }
      .pipeline-trigger:hover {
        background-color: color-mix(
          in srgb,
          var(--primary-text-color) 5%,
          transparent
        );
        color: var(--primary-text-color);
      }
      .pipeline-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .caret {
        width: 18px;
        height: 18px;
        flex: 0 0 auto;
        fill: currentColor;
      }

      .popover.menu {
        top: 58px;
        left: 12px;
        min-width: 240px;
        max-width: min(320px, calc(100% - 24px));
        transform-origin: top left;
      }
      .menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 12px;
        border: none;
        background: none;
        border-radius: var(--ha-border-radius-md, 8px);
        color: var(--primary-text-color);
        font: inherit;
        font-size: var(--ha-font-size-l, 1rem);
        text-align: left;
        cursor: pointer;
      }
      .menu-item:hover {
        background-color: color-mix(
          in srgb,
          var(--primary-text-color) 5%,
          transparent
        );
      }
      .menu-item.selected {
        color: var(--primary-color);
      }
      .menu-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .menu-item .star {
        width: 18px;
        height: 18px;
        flex: 0 0 auto;
        fill: var(--primary-color);
      }
      .menu-item .next {
        width: 18px;
        height: 18px;
        flex: 0 0 auto;
        fill: var(--secondary-text-color);
      }
      .menu-item.manage {
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-m, 0.9rem);
      }
      .menu-divider {
        height: 1px;
        margin: 6px 4px;
        background-color: var(--divider-color);
      }
      .cog {
        flex: 0 0 auto;
        color: var(--secondary-text-color);
        --mdc-icon-button-size: 40px;
        --mdc-icon-size: 22px;
        transition:
          color 160ms ease-out,
          transform 200ms ease-out;
      }
      .cog:hover {
        color: var(--primary-text-color);
      }
      .cog.active {
        color: var(--primary-color);
        transform: rotate(45deg);
      }

      /* Settings popover -------------------------------------------------- */
      .popover.settings {
        top: 56px;
        right: 10px;
        width: min(340px, calc(100% - 20px));
        transform-origin: top right;
      }
      .settings-head {
        padding: 8px 10px 6px;
        font-size: var(--ha-font-size-s, 0.75rem);
        font-weight: var(--ha-font-weight-medium, 500);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--secondary-text-color);
      }
      .setting {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        border-radius: var(--ha-border-radius-md, 8px);
        cursor: pointer;
      }
      .setting:hover {
        background-color: color-mix(
          in srgb,
          var(--primary-text-color) 4%,
          transparent
        );
      }
      .setting-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .setting-label {
        font-size: var(--ha-font-size-l, 1rem);
        color: var(--primary-text-color);
      }
      .setting-desc {
        font-size: var(--ha-font-size-s, 0.8rem);
        line-height: 1.4;
        color: var(--secondary-text-color);
      }
      ha-switch {
        flex: 0 0 auto;
      }

      @media (prefers-reduced-motion: reduce) {
        .backdrop,
        .content {
          animation: none;
        }
        .cog {
          transition: none !important;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "assist-mcp-chat-drawer": AssistMcpChatDrawer;
  }
}
