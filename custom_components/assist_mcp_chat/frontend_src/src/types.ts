// Minimal surface of the Home Assistant frontend `hass` object that this module
// relies on. The full type lives in the Home Assistant frontend repository; we only
// declare what we use so this standalone bundle has no dependency on HA internals.

export interface HassConnection {
  subscribeMessage<T>(
    callback: (message: T) => void,
    subscribeMessage: Record<string, unknown>
  ): Promise<() => void>;
}

export interface HomeAssistant {
  connection: HassConnection;
  localize: (key: string, values?: Record<string, unknown>) => string;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
}

export interface AssistPipeline {
  id: string;
  name: string;
}

export interface AssistPipelineList {
  pipelines: AssistPipeline[];
  preferred_pipeline: string | null;
}

// Subset of pipeline run events we consume (text/intent stage only).
export interface PipelineRunEvent {
  type: string;
  data: Record<string, any>;
}
