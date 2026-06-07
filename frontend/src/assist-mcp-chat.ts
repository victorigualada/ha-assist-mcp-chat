import { css, html, LitElement, type TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import "./assist-mcp-turn";
import { mdiSend, mdiStop } from "@mdi/js";
import { runPipeline } from "./pipeline";
import { tokens } from "./shared-styles";
import type {
  AssistantTurn,
  HomeAssistant,
  ToolStep,
  Turn,
  UserTurn,
} from "./types";

let _seq = 0;
const nextId = (): string => `t${++_seq}`;

/**
 * Agent-console chat surface.
 *
 * Sends each message through the `assist_pipeline/run` WebSocket API (intent
 * stage), so the configured conversation agent — and any tools it exposes,
 * including the ha-mcp tools — answer exactly as in core Assist. Streaming and
 * event parsing live in `pipeline.ts`; each assistant turn is rendered by
 * `<assist-mcp-turn>` so only the in-flight turn re-renders.
 */
@customElement("assist-mcp-chat")
export class AssistMcpChat extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public pipelineId?: string;

  // When false, the reasoning / tool-call activity stream is hidden on turns.
  @property({ attribute: false, type: Boolean }) public showActivity = true;

  @query("#scroll-container") private _scrollContainer?: HTMLDivElement;

  @query("#message-input") private _input?: HTMLTextAreaElement;

  @state() private _conversation: Turn[] = [];

  @state() private _processing = false;

  private _conversationId: string | null = null;

  private _greetingId = "";

  private _cancel?: () => void;

  private _lastUserText = "";

  private _pinned = true;

  protected willUpdate(changed: Map<string, unknown>): void {
    if (!this.hasUpdated || changed.has("pipelineId")) {
      this._reset();
    }
  }

  private _reset(): void {
    this._cancel?.();
    this._cancel = undefined;
    this._processing = false;
    this._conversationId = null;
    this._pinned = true;
    const greeting: AssistantTurn = {
      id: nextId(),
      role: "assistant",
      thinking: "",
      steps: [],
      answer: this.hass.localize("ui.dialogs.voice_command.how_can_i_help"),
      error: false,
      done: true,
    };
    this._greetingId = greeting.id;
    this._conversation = [greeting];
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has("_conversation") && this._pinned) {
      this._scrollContainer?.scrollTo({
        top: this._scrollContainer.scrollHeight,
      });
    }
  }

  /** Focus the composer so the user can type immediately. */
  public focusInput(): void {
    this._input?.focus();
  }

  protected render(): TemplateResult {
    const lastId = this._conversation[this._conversation.length - 1]?.id;
    return html`
      <div class="messages" id="scroll-container" @scroll=${this._onScroll}>
        <div class="spacer"></div>
        ${repeat(
          this._conversation,
          (turn) => turn.id,
          (turn) =>
            turn.role === "user"
              ? html`<div class="user">
                  <div class="bubble">${(turn as UserTurn).text}</div>
                </div>`
              : html`<assist-mcp-turn
                  .hass=${this.hass}
                  .turn=${turn}
                  .showActivity=${this.showActivity}
                  .isLast=${turn.id === lastId}
                  .isGreeting=${turn.id === this._greetingId}
                  @retry=${this._retry}
                ></assist-mcp-turn>`,
        )}
      </div>
      ${this._renderComposer()}
    `;
  }

  private _renderComposer(): TemplateResult {
    return html`
      <div class="composer">
        <textarea
          id="message-input"
          rows="1"
          autocomplete="off"
          .placeholder=${
            this.hass.localize("ui.dialogs.voice_command.input_label") ||
            "Ask anything…"
          }
          @keydown=${this._handleKeyDown}
          @input=${this._autoGrow}
        ></textarea>
        ${
          this._processing
            ? html`<button class="send stop" title="Stop" @click=${this._stop}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d=${mdiStop}></path>
              </svg>
            </button>`
            : html`<button
              class="send"
              title="Send"
              @click=${this._sendFromInput}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d=${mdiSend}></path>
              </svg>
            </button>`
        }
      </div>
    `;
  }

  private _onScroll(): void {
    const el = this._scrollContainer;
    if (!el) {
      return;
    }
    this._pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  private _autoGrow(): void {
    const el = this._input;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  private _handleKeyDown(ev: KeyboardEvent): void {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      this._sendFromInput();
    }
  }

  private _sendFromInput(): void {
    const el = this._input;
    if (!el || this._processing) {
      return;
    }
    const text = el.value.trim();
    if (!text) {
      return;
    }
    el.value = "";
    el.style.height = "auto";
    this._run(text);
  }

  private _retry(): void {
    if (this._processing || !this._lastUserText) {
      return;
    }
    const conv = [...this._conversation];
    if (conv[conv.length - 1]?.role === "assistant") {
      conv.pop();
    }
    this._conversation = conv;
    this._run(this._lastUserText, true);
  }

  private async _run(text: string, isRetry = false): Promise<void> {
    this._lastUserText = text;
    this._processing = true;
    this._pinned = true;

    const id = nextId();
    const acc = {
      thinking: "",
      steps: [] as ToolStep[],
      answer: "",
      error: false,
    };
    const buildTurn = (done: boolean): AssistantTurn => ({
      id,
      role: "assistant",
      thinking: acc.thinking,
      steps: acc.steps,
      answer: acc.answer,
      error: acc.error,
      done,
    });

    const base: Turn[] = isRetry
      ? this._conversation
      : [...this._conversation, { id: nextId(), role: "user", text }];
    this._conversation = [...base, buildTurn(false)];

    // Commit immutably so keyed repeat() updates only this turn.
    const commit = (done = false): void => {
      const turn = buildTurn(done);
      this._conversation = this._conversation.map((t) =>
        t.id === id ? turn : t,
      );
    };
    const finish = (): void => {
      this._processing = false;
      this._cancel = undefined;
    };

    const handle: { stop?: () => void } = {};
    // Stop button: cancel the run and mark the turn done where it stands.
    this._cancel = () => {
      handle.stop?.();
      commit(true);
      finish();
    };

    handle.stop = await runPipeline(
      this.hass,
      {
        text,
        pipelineId: this.pipelineId,
        conversationId: this._conversationId,
      },
      {
        onThinking: (t) => {
          acc.thinking += t;
          commit();
        },
        onToolCall: (call) => {
          if (acc.steps.some((s) => s.id === call.id)) {
            return;
          }
          acc.steps = [
            ...acc.steps,
            {
              id: call.id,
              name: call.tool_name,
              args: call.tool_args ?? {},
              done: false,
            },
          ];
          commit();
        },
        onToolResult: (toolCallId, result) => {
          acc.steps = acc.steps.map((s) =>
            s.id === toolCallId ? { ...s, result, done: true } : s,
          );
          commit();
        },
        onAnswer: (t) => {
          acc.answer += t;
          commit();
        },
        onComplete: (conversationId, fallbackAnswer) => {
          this._conversationId = conversationId;
          if (!acc.answer && fallbackAnswer) {
            acc.answer = fallbackAnswer;
          }
          commit(true);
          finish();
        },
        onError: (message) => {
          acc.error = true;
          acc.answer = message;
          commit(true);
          finish();
        },
      },
    );
  }

  private _stop(): void {
    this._cancel?.();
  }

  static styles = [
    tokens,
    css`
      :host {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .messages {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--amc-space-4);
        overflow-y: auto;
        padding: var(--amc-space-4) var(--amc-space-4) var(--amc-space-2);
        scrollbar-width: thin;
      }
      .spacer {
        flex: 1;
        min-height: var(--amc-space-2);
      }
      .user {
        display: flex;
        justify-content: flex-end;
        animation: rise 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
      }
      .bubble {
        max-width: 85%;
        padding: var(--amc-space-2) var(--amc-space-3);
        border-radius: var(--amc-radius);
        border-bottom-right-radius: var(--ha-border-radius-sm, 4px);
        background-color: var(--primary-color);
        color: var(--text-primary-color);
        font-size: var(--ha-font-size-l, 1rem);
        line-height: 1.45;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .composer {
        display: flex;
        align-items: flex-end;
        gap: var(--amc-space-2);
        padding: var(--amc-space-3) var(--amc-space-4)
          max(var(--amc-space-3), env(safe-area-inset-bottom));
        border-top: 1px solid var(--divider-color);
        background-color: var(--card-background-color);
      }
      textarea {
        flex: 1;
        resize: none;
        box-sizing: border-box;
        max-height: 140px;
        padding: 10px var(--amc-space-3);
        border-radius: var(--amc-radius);
        border: 1px solid var(--divider-color);
        background-color: var(--primary-background-color);
        color: var(--primary-text-color);
        font: inherit;
        font-size: var(--ha-font-size-l, 1rem);
        line-height: 1.45;
        scrollbar-width: thin;
      }
      textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 1px var(--primary-color);
      }
      .send {
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        background-color: var(--primary-color);
        color: var(--text-primary-color);
        transition:
          transform 120ms ease-out,
          background-color 160ms ease-out;
      }
      .send:hover {
        transform: scale(1.06);
      }
      .send:active {
        transform: scale(0.96);
      }
      .send svg {
        width: 20px;
        height: 20px;
        fill: var(--text-primary-color);
      }
      .send.stop {
        background-color: var(--error-color);
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
      @media (prefers-reduced-motion: reduce) {
        .user,
        .send {
          animation: none !important;
          transition: none !important;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "assist-mcp-chat": AssistMcpChat;
  }
}
