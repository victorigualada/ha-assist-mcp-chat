// Shared, persisted user settings for the chat drawer.
//
// Lives in its own module because both the drawer (which edits settings) and the
// entrypoint keyboard handler (which reads the shortcut setting) depend on it.

export const SETTINGS_KEY = "assist-mcp-chat-settings";
export const SETTINGS_EVENT = "assist-mcp-chat-settings-changed";

export interface ChatSettings {
  // Show the reasoning / tool-call activity stream on assistant turns.
  showActivity: boolean;
  // When true, "a" opens the chat (overriding Home Assistant's Assist shortcut).
  // When false, the chat opens with "k" and "a" keeps its default behavior.
  shortcutOverride: boolean;
}

export const DEFAULT_SETTINGS: ChatSettings = {
  showActivity: true,
  shortcutOverride: true,
};

export const loadSettings = (): ChatSettings => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      : { ...DEFAULT_SETTINGS };
  } catch (_err) {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = (settings: ChatSettings): void => {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  // Notify same-tab listeners (the native `storage` event only fires cross-tab).
  window.dispatchEvent(
    new CustomEvent<ChatSettings>(SETTINGS_EVENT, { detail: settings }),
  );
};

// The key that opens the chat, derived from the override setting.
export const shortcutKeyFor = (settings: ChatSettings): string =>
  settings.shortcutOverride ? "a" : "k";
