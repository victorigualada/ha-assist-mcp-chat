import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { mdiCheck, mdiChevronRight, mdiContentCopy, mdiRefresh } from "@mdi/js";
import { tokens } from "./shared-styles";
import type { AssistantTurn, HomeAssistant, ToolStep } from "./types";

/**
 * Renders a single assistant turn: its reasoning, the tools it called (with
 * arguments and results), the streamed answer, and per-message actions.
 *
 * Transient view state (which sections are expanded, copy feedback) lives here,
 * not in the turn data, so it survives the frequent `.turn` updates during
 * streaming — the parent reuses this instance via a keyed `repeat()`.
 */
@customElement("assist-mcp-turn")
export class AssistMcpTurn extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public turn!: AssistantTurn;

  @property({ type: Boolean }) public showActivity = true;

  @property({ type: Boolean }) public isLast = false;

  @property({ type: Boolean }) public isGreeting = false;

  @state() private _activityOpen = true;

  @state() private _thinkingOpen = false;

  @state() private _expanded = new Set<string>();

  @state() private _copied = false;

  protected render(): TemplateResult {
    const { turn } = this;
    const hasActivity = !!turn.thinking || turn.steps.length > 0;
    const showActivityBlock = hasActivity && this.showActivity;
    const showWorking = !turn.done && !turn.answer && !showActivityBlock;
    const canCopy =
      turn.done && !!turn.answer && !turn.error && !this.isGreeting;

    return html`
      <div class="turn ${classMap({ error: turn.error })}">
        ${showActivityBlock ? this._renderActivity() : nothing}
        ${
          showWorking
            ? html`<div class="working" aria-label="Working">
              <span></span><span></span><span></span>
            </div>`
            : nothing
        }
        ${
          turn.answer
            ? turn.error
              ? html`<div class="answer error-text">${turn.answer}</div>`
              : html`<ha-markdown
                class="answer"
                .content=${turn.answer}
              ></ha-markdown>`
            : nothing
        }
        ${canCopy ? this._renderActions() : nothing}
      </div>
    `;
  }

  private _renderActivity(): TemplateResult {
    const { turn } = this;
    const count = turn.steps.length;
    const summary = !turn.done
      ? this.hass.localize("ui.common.loading") || "Working…"
      : count
        ? `${count} ${count === 1 ? "tool" : "tools"}`
        : "Reasoning";

    return html`
      <section class="activity ${classMap({ open: this._activityOpen })}">
        <button
          class="row-head"
          @click=${() => (this._activityOpen = !this._activityOpen)}
          aria-expanded=${this._activityOpen}
        >
          <span
            class="status ${classMap({ live: !turn.done })}"
            aria-hidden="true"
          >
            ${turn.done ? this._icon(mdiCheck) : nothing}
          </span>
          <span class="row-label">${summary}</span>
          <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d=${mdiChevronRight}></path>
          </svg>
        </button>
        ${
          this._activityOpen
            ? html`<div class="activity-body">
              ${turn.thinking ? this._renderThinking() : nothing}
              ${turn.steps.map((step) => this._renderStep(step))}
            </div>`
            : nothing
        }
      </section>
    `;
  }

  private _renderThinking(): TemplateResult {
    return html`
      <div class="step thinking ${classMap({ open: this._thinkingOpen })}">
        <button
          class="row-head"
          @click=${() => (this._thinkingOpen = !this._thinkingOpen)}
          aria-expanded=${this._thinkingOpen}
        >
          <span class="dot reason" aria-hidden="true"></span>
          <span class="row-label">Reasoning</span>
          <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d=${mdiChevronRight}></path>
          </svg>
        </button>
        ${
          this._thinkingOpen
            ? html`<div class="step-body">
              <pre class="reason-text">${this.turn.thinking}</pre>
            </div>`
            : nothing
        }
      </div>
    `;
  }

  private _renderStep(step: ToolStep): TemplateResult {
    const open = this._expanded.has(step.id);
    const hasArgs = step.args && Object.keys(step.args).length > 0;
    const hasResult = step.result !== undefined && step.result !== null;
    return html`
      <div class="step tool ${classMap({ open })}">
        <button
          class="row-head"
          @click=${() => this._toggleStep(step.id)}
          aria-expanded=${open}
        >
          <span class="dot ${classMap({ done: step.done })}" aria-hidden="true">
            ${step.done ? this._icon(mdiCheck) : nothing}
          </span>
          <span class="row-label mono">${step.name}</span>
          <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d=${mdiChevronRight}></path>
          </svg>
        </button>
        ${
          open
            ? html`<div class="step-body">
              ${
                hasArgs
                  ? html`<div class="field">
                    <span class="field-label">Arguments</span>
                    <pre class="mono">${JSON.stringify(step.args, null, 2)}</pre>
                  </div>`
                  : nothing
              }
              ${
                hasResult
                  ? html`<div class="field">
                    <span class="field-label">Result</span>
                    <pre class="mono">${stringify(step.result)}</pre>
                  </div>`
                  : html`<div class="field-pending">
                    ${step.done ? "No output" : "Running…"}
                  </div>`
              }
            </div>`
            : nothing
        }
      </div>
    `;
  }

  private _renderActions(): TemplateResult {
    return html`
      <div class="actions">
        <button
          class="action"
          title=${this._copied ? "Copied" : "Copy"}
          @click=${this._copy}
        >
          ${this._icon(this._copied ? mdiCheck : mdiContentCopy)}
          <span>${this._copied ? "Copied" : "Copy"}</span>
        </button>
        ${
          this.isLast
            ? html`<button
              class="action"
              title="Regenerate"
              @click=${this._retry}
            >
              ${this._icon(mdiRefresh)}
              <span>Retry</span>
            </button>`
            : nothing
        }
      </div>
    `;
  }

  private _icon(path: string): TemplateResult {
    return html`<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d=${path}></path>
    </svg>`;
  }

  private _toggleStep(id: string): void {
    const next = new Set(this._expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this._expanded = next;
  }

  private async _copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.turn.answer);
      this._copied = true;
      window.setTimeout(() => (this._copied = false), 1600);
    } catch (_err) {
      // Clipboard unavailable (e.g. insecure context) — silently ignore.
    }
  }

  private _retry(): void {
    this.dispatchEvent(
      new CustomEvent("retry", { bubbles: true, composed: true }),
    );
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .turn {
        display: flex;
        flex-direction: column;
        gap: var(--amc-space-2);
        animation: rise 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
      }

      /* Activity stream ------------------------------------------------- */
      .activity {
        border: 1px solid var(--divider-color);
        border-radius: var(--amc-radius);
        background-color: var(--amc-surface);
        overflow: hidden;
      }
      .row-head {
        display: flex;
        align-items: center;
        gap: var(--amc-space-2);
        width: 100%;
        padding: var(--amc-space-2) var(--amc-space-3);
        background: none;
        border: none;
        cursor: pointer;
        color: var(--primary-text-color);
        font: inherit;
        text-align: left;
      }
      .row-head:hover {
        background-color: color-mix(
          in srgb,
          var(--primary-text-color) 4%,
          transparent
        );
      }
      .row-label {
        flex: 1;
        font-size: var(--ha-font-size-m, 0.9rem);
        font-weight: var(--ha-font-weight-medium, 500);
        overflow-wrap: anywhere;
      }
      .step .row-label {
        font-weight: var(--ha-font-weight-normal, 400);
      }
      .mono {
        font-family: var(--amc-mono);
      }
      .chevron {
        width: 16px;
        height: 16px;
        flex: 0 0 auto;
        fill: var(--secondary-text-color);
        transition: transform 200ms cubic-bezier(0.2, 0.7, 0.2, 1);
      }
      .activity.open > .row-head .chevron,
      .step.open > .row-head .chevron {
        transform: rotate(90deg);
      }

      .status,
      .dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: 16px;
        height: 16px;
      }
      .status svg,
      .dot svg {
        width: 15px;
        height: 15px;
        fill: var(--success-color, #43a047);
      }
      .status.live::before,
      .dot:not(.done):not(.reason)::before {
        content: "";
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background-color: var(--primary-color);
        animation: pulse 1.1s ease-in-out infinite;
      }
      .dot.reason::before {
        content: "";
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background-color: var(--secondary-text-color);
        opacity: 0.6;
      }

      .activity-body {
        padding: 0 var(--amc-space-2) var(--amc-space-2);
        display: flex;
        flex-direction: column;
        gap: var(--amc-space-2);
        animation: reveal 220ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
      }
      .step {
        border-radius: var(--ha-border-radius-md, 8px);
        background-color: var(--card-background-color);
        border: 1px solid var(--divider-color);
        overflow: hidden;
      }
      .step-body {
        padding: 0 var(--amc-space-3) var(--amc-space-3);
        display: flex;
        flex-direction: column;
        gap: var(--amc-space-2);
        animation: reveal 200ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
      }
      .field-label {
        display: block;
        font-size: var(--ha-font-size-s, 0.75rem);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--secondary-text-color);
        margin-bottom: 4px;
      }
      pre {
        margin: 0;
        padding: var(--amc-space-2) var(--amc-space-3);
        background-color: color-mix(
          in srgb,
          var(--primary-text-color) 6%,
          transparent
        );
        border-radius: var(--ha-border-radius-sm, 6px);
        font-family: var(--amc-mono);
        font-size: var(--ha-font-size-s, 0.8rem);
        line-height: 1.5;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        max-height: 240px;
        overflow-y: auto;
        color: var(--primary-text-color);
      }
      .reason-text {
        color: var(--secondary-text-color);
        background-color: transparent;
        padding: 0;
      }
      .field-pending {
        font-size: var(--ha-font-size-s, 0.8rem);
        color: var(--secondary-text-color);
        font-style: italic;
        padding-bottom: var(--amc-space-2);
      }

      /* Answer ---------------------------------------------------------- */
      .answer {
        font-size: var(--ha-font-size-l, 1rem);
        line-height: 1.55;
        color: var(--primary-text-color);
        overflow-wrap: anywhere;
      }
      .answer.error-text {
        color: var(--error-color);
        white-space: pre-wrap;
      }
      ha-markdown.answer {
        display: block;
      }

      /* Working indicator ---------------------------------------------- */
      .working {
        display: inline-flex;
        gap: 5px;
        padding: var(--amc-space-2) 0;
      }
      .working span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background-color: var(--secondary-text-color);
        animation: blink 1.2s ease-in-out infinite both;
      }
      .working span:nth-child(2) {
        animation-delay: 0.18s;
      }
      .working span:nth-child(3) {
        animation-delay: 0.36s;
      }

      /* Actions --------------------------------------------------------- */
      .actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 160ms ease-out;
      }
      :host(:hover) .actions,
      .turn:focus-within .actions {
        opacity: 1;
      }
      .action {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 8px;
        border: none;
        background: none;
        border-radius: var(--ha-border-radius-sm, 6px);
        color: var(--secondary-text-color);
        font: inherit;
        font-size: var(--ha-font-size-s, 0.78rem);
        cursor: pointer;
      }
      .action:hover {
        background-color: var(--amc-surface);
        color: var(--primary-text-color);
      }
      .action svg {
        width: 15px;
        height: 15px;
        fill: currentColor;
      }

      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      @keyframes reveal {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      @keyframes pulse {
        0%,
        100% {
          transform: scale(0.7);
          opacity: 0.5;
        }
        50% {
          transform: scale(1);
          opacity: 1;
        }
      }
      @keyframes blink {
        0%,
        80%,
        100% {
          opacity: 0.25;
          transform: scale(0.85);
        }
        40% {
          opacity: 1;
          transform: scale(1);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .turn,
        .chevron,
        .activity-body,
        .step-body,
        .working span,
        .status.live::before,
        .dot::before {
          animation: none !important;
          transition: none !important;
        }
      }
    `,
  ];
}

function stringify(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (_err) {
    return String(value);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "assist-mcp-turn": AssistMcpTurn;
  }
}
