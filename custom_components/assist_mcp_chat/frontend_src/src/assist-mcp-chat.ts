import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import type { HomeAssistant, PipelineRunEvent } from "./types";

interface ChatMessage {
  who: "user" | "hass";
  text: string;
  error?: boolean;
}

const PLACEHOLDER = "…";

/**
 * Markdown-enriched Assist chat.
 *
 * Talks to the existing `assist_pipeline/run` WebSocket API (text/intent stage),
 * so the configured conversation agent — and any tools it exposes, including the
 * ha-mcp tools registered by this integration — answer exactly as in core Assist.
 * The streaming delta handling mirrors core's `ha-assist-chat`; the only enrichment
 * is rendering assistant turns through `<ha-markdown>`.
 */
@customElement("assist-mcp-chat")
export class AssistMcpChat extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public pipelineId?: string;

  @query("#scroll-container") private _scrollContainer?: HTMLDivElement;

  @state() private _conversation: ChatMessage[] = [];

  @state() private _processing = false;

  private _conversationId: string | null = null;

  protected willUpdate(changed: Map<string, unknown>): void {
    if (!this.hasUpdated || changed.has("pipelineId")) {
      this._conversation = [
        {
          who: "hass",
          text: this.hass.localize("ui.dialogs.voice_command.how_can_i_help"),
        },
      ];
      this._conversationId = null;
    }
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has("_conversation")) {
      this._scrollContainer?.scrollTo(0, this._scrollContainer.scrollHeight);
    }
  }

  protected render() {
    return html`
      <div class="messages" id="scroll-container">
        <div class="spacer"></div>
        ${this._conversation.map(
          (message) => html`
            <div
              class="message ${classMap({
                error: !!message.error,
                [message.who]: true,
              })}"
            >
              ${message.who === "hass" && !message.error
                ? html`<ha-markdown .content=${message.text}></ha-markdown>`
                : message.text}
            </div>
          `
        )}
      </div>
      <div class="input">
        <input
          id="message-input"
          type="text"
          autocomplete="off"
          .placeholder=${this.hass.localize(
            "ui.dialogs.voice_command.input_label"
          )}
          ?disabled=${this._processing}
          @keydown=${this._handleKeyDown}
        />
      </div>
    `;
  }

  private _handleKeyDown(ev: KeyboardEvent): void {
    const input = ev.target as HTMLInputElement;
    if (ev.key === "Enter" && input.value && !this._processing) {
      const text = input.value.trim();
      input.value = "";
      this._processText(text);
    }
  }

  private _addMessage(message: ChatMessage): void {
    this._conversation = [...this._conversation, message];
  }

  private async _processText(text: string): Promise<void> {
    this._processing = true;
    this._addMessage({ who: "user", text });

    const hassMessage: ChatMessage = { who: "hass", text: PLACEHOLDER };
    this._addMessage(hassMessage);

    let currentRole = "";
    const render = () => this.requestUpdate("_conversation");

    const setError = (error: string) => {
      hassMessage.text = error;
      hassMessage.error = true;
      render();
    };

    try {
      const unsub = await this.hass.connection.subscribeMessage<PipelineRunEvent>(
        (event) => {
          if (event.type === "intent-progress" && event.data.chat_log_delta) {
            const delta = event.data.chat_log_delta;
            if (delta.role) {
              currentRole = delta.role;
            }
            if (currentRole === "assistant" && delta.content) {
              hassMessage.text =
                (hassMessage.text === PLACEHOLDER ? "" : hassMessage.text) +
                delta.content;
              render();
            }
          } else if (event.type === "intent-end") {
            this._conversationId = event.data.intent_output.conversation_id;
            const response =
              event.data.intent_output.response.speech?.plain?.speech;
            if (
              event.data.intent_output.response.response_type === "error" &&
              response
            ) {
              setError(response);
            } else if (response && hassMessage.text === PLACEHOLDER) {
              // Non-streaming agents only deliver the full text at intent-end.
              hassMessage.text = response;
              render();
            }
            unsub();
          } else if (event.type === "error") {
            setError(event.data.message);
            unsub();
          }
        },
        {
          type: "assist_pipeline/run",
          start_stage: "intent",
          end_stage: "intent",
          input: { text },
          pipeline: this.pipelineId,
          conversation_id: this._conversationId,
        }
      );
    } catch (err) {
      setError(
        this.hass.localize("ui.dialogs.voice_command.error") ||
          String(err) ||
          "Error"
      );
    } finally {
      this._processing = false;
    }
  }

  static styles = css`
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
      overflow-y: auto;
      padding: 0 12px 16px;
    }
    .spacer {
      flex: 1;
    }
    .message {
      font-size: var(--ha-font-size-l, 1rem);
      margin: 8px 0;
      padding: 8px 12px;
      border-radius: var(--ha-border-radius-xl, 18px);
      max-width: 85%;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }
    .message.user {
      align-self: flex-end;
      text-align: right;
      border-bottom-right-radius: 0;
      background-color: var(--chat-background-color-user, var(--primary-color));
      color: var(--text-primary-color);
    }
    .message.hass {
      align-self: flex-start;
      border-bottom-left-radius: 0;
      background-color: var(
        --chat-background-color-hass,
        var(--secondary-background-color)
      );
      color: var(--primary-text-color);
      white-space: normal;
    }
    .message.error {
      background-color: var(--error-color);
      color: var(--text-primary-color);
    }
    .message ha-markdown {
      display: block;
    }
    .input {
      padding: 8px 12px;
      border-top: 1px solid var(--divider-color);
    }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      border-radius: var(--ha-border-radius-xl, 18px);
      border: 1px solid var(--divider-color);
      background-color: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: var(--ha-font-size-l, 1rem);
    }
    input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "assist-mcp-chat": AssistMcpChat;
  }
}
