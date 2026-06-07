// Minimal surface of the Home Assistant frontend `hass` object that this module
// relies on. The full type lives in the Home Assistant frontend repository; we only
// declare what we use so this standalone bundle has no dependency on HA internals.

export interface HassConnection {
  subscribeMessage<T>(
    callback: (message: T) => void,
    subscribeMessage: Record<string, unknown>,
  ): Promise<() => void>;
}

export interface HomeAssistant {
  connection: HassConnection;
  localize: (key: string, values?: Record<string, unknown>) => string;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  user?: { is_admin?: boolean };
}

export interface AssistPipeline {
  id: string;
  name: string;
}

export interface AssistPipelineList {
  pipelines: AssistPipeline[];
  preferred_pipeline: string | null;
}

// A single tool invocation the model requested, as streamed by HA's chat log.
export interface ToolCall {
  id: string;
  tool_name: string;
  tool_args: Record<string, unknown>;
}

// One delta of an assistant/tool-result content block. HA streams these inside
// `intent-progress` events; see homeassistant/components/conversation/chat_log.py
// (AssistantContentDeltaDict / ToolResultContentDeltaDict).
export interface ChatLogDelta {
  role?: "assistant" | "tool_result";
  content?: string | null;
  thinking_content?: string | null;
  tool_calls?: ToolCall[] | null;
  // Present only on tool_result deltas.
  tool_call_id?: string;
  tool_name?: string;
  tool_result?: unknown;
}

// ---------------------------------------------------------------------------
// Conversation view-model. These describe the data of a turn; transient view
// state (which sections are expanded) lives in the turn component, not here.
// ---------------------------------------------------------------------------

export interface ToolStep {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  done: boolean;
}

export interface UserTurn {
  id: string;
  role: "user";
  text: string;
}

export interface AssistantTurn {
  id: string;
  role: "assistant";
  thinking: string;
  steps: ToolStep[];
  answer: string;
  error: boolean;
  done: boolean;
}

export type Turn = UserTurn | AssistantTurn;

// Subset of pipeline run events we consume (text/intent stage only).
export interface PipelineRunEvent {
  type: string;
  data: {
    chat_log_delta?: ChatLogDelta;
    intent_output?: {
      conversation_id: string;
      response: {
        response_type?: string;
        speech?: { plain?: { speech?: string } };
      };
    };
    message?: string;
  };
}
