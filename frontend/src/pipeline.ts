// Drives a single Assist pipeline run (intent stage) and reports what the model
// does as typed callbacks, so the view layer never touches the WebSocket or the
// raw event shapes.

import type { HomeAssistant, PipelineRunEvent, ToolCall } from "./types";

export interface PipelineCallbacks {
  /** A chunk of streamed reasoning. */
  onThinking(text: string): void;
  /** The model requested a tool call. */
  onToolCall(call: ToolCall): void;
  /** A previously-requested tool returned a result. */
  onToolResult(toolCallId: string, result: unknown): void;
  /** A chunk of the streamed answer. */
  onAnswer(text: string): void;
  /**
   * The run finished. `fallbackAnswer` is the full speech text some
   * non-streaming agents only deliver at the end.
   */
  onComplete(conversationId: string | null, fallbackAnswer?: string): void;
  /** The run failed (transport error or an error response). */
  onError(message: string): void;
}

export interface RunOptions {
  text: string;
  pipelineId?: string;
  conversationId: string | null;
}

/**
 * Start a pipeline run. Resolves with a `stop()` function that cancels the run
 * and unsubscribes. Safe to call `stop()` multiple times.
 */
export async function runPipeline(
  hass: HomeAssistant,
  { text, pipelineId, conversationId }: RunOptions,
  cb: PipelineCallbacks,
): Promise<() => void> {
  let currentRole = "";
  let unsub: (() => void) | undefined;
  let finished = false;

  const stop = (): void => {
    if (finished) {
      return;
    }
    finished = true;
    unsub?.();
    unsub = undefined;
  };

  const handle = (event: PipelineRunEvent): void => {
    if (event.type === "intent-progress" && event.data.chat_log_delta) {
      const delta = event.data.chat_log_delta;
      if (delta.role) {
        currentRole = delta.role;
      }
      if (delta.thinking_content) {
        cb.onThinking(delta.thinking_content);
      }
      delta.tool_calls?.forEach(cb.onToolCall);
      if (currentRole === "tool_result" && delta.tool_call_id) {
        cb.onToolResult(delta.tool_call_id, delta.tool_result);
      }
      if (currentRole === "assistant" && delta.content) {
        cb.onAnswer(delta.content);
      }
    } else if (event.type === "intent-end") {
      const output = event.data.intent_output;
      const speech = output?.response.speech?.plain?.speech;
      if (output?.response.response_type === "error" && speech) {
        cb.onError(speech);
      } else {
        cb.onComplete(output?.conversation_id ?? conversationId, speech);
      }
      stop();
    } else if (event.type === "error") {
      cb.onError(event.data.message ?? "Error");
      stop();
    }
  };

  try {
    unsub = await hass.connection.subscribeMessage<PipelineRunEvent>(handle, {
      type: "assist_pipeline/run",
      start_stage: "intent",
      end_stage: "intent",
      input: { text },
      pipeline: pipelineId,
      conversation_id: conversationId,
    });
    // The run may have completed synchronously before the subscription resolved.
    if (finished) {
      unsub();
    }
  } catch (err) {
    cb.onError(err instanceof Error ? err.message : "Error");
    stop();
  }

  return stop;
}
