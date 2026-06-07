import "./assist-mcp-chat-drawer";
import type { AssistMcpChatDrawer } from "./assist-mcp-chat-drawer";
import {
  loadSettings,
  shortcutKeyFor,
  SETTINGS_EVENT,
  type ChatSettings,
} from "./settings";
import type { HomeAssistant } from "./types";

// The Assist button opens the centered dialog through a "show-dialog" event with
// this dialogTag. Intercepting that event re-routes the button to our right-side
// drawer without patching any core frontend code. The "a" keyboard shortcut does
// NOT reliably route through this event, so it is handled separately below.
const ASSIST_DIALOG_TAG = "ha-voice-command-dialog";
const DRAWER_TAG = "assist-mcp-chat-drawer";

// Key that opens the chat drawer. Derived from the user's settings and kept in
// sync live so toggling the override doesn't require a reload.
let shortcutKey = shortcutKeyFor(loadSettings());
window.addEventListener(SETTINGS_EVENT, (ev: Event) => {
  shortcutKey = shortcutKeyFor((ev as CustomEvent<ChatSettings>).detail);
});

let drawer: AssistMcpChatDrawer | undefined;

const getHomeAssistant = (): (HTMLElement & { hass?: HomeAssistant }) | null =>
  document.querySelector("home-assistant");

const openDrawer = (params?: { pipeline_id?: string }): void => {
  const ha = getHomeAssistant();
  const hass = ha?.hass;
  if (!ha || !hass) {
    return;
  }
  const root = ha.shadowRoot ?? document.body;
  if (!drawer) {
    drawer = document.createElement(DRAWER_TAG) as AssistMcpChatDrawer;
    root.appendChild(drawer);
  }
  drawer.hass = hass;
  drawer.openDialog(params);
};

window.addEventListener(
  "show-dialog",
  (ev: Event) => {
    const detail = (ev as CustomEvent).detail;
    if (!detail || detail.dialogTag !== ASSIST_DIALOG_TAG) {
      return;
    }
    // Capture phase + stopImmediatePropagation prevents the core dialog manager
    // (listening further down on <home-assistant>) from opening the old dialog.
    ev.stopImmediatePropagation();
    ev.preventDefault();
    openDrawer(detail.dialogParams);
  },
  true,
);

// Walk down through shadow roots to find the element that actually has focus;
// document.activeElement only reports the top-level host otherwise.
const deepActiveElement = (): Element | null => {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) {
    el = el.shadowRoot.activeElement;
  }
  return el;
};

// Don't hijack the key while the user is typing — including inside the drawer's
// own chat input, which lives in a nested shadow root.
const isTypingTarget = (el: Element | null): boolean => {
  if (!el) {
    return false;
  }
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (el as HTMLElement).isContentEditable
  );
};

window.addEventListener(
  "keydown",
  (ev: KeyboardEvent) => {
    if (
      ev.key.toLowerCase() !== shortcutKey ||
      ev.ctrlKey ||
      ev.metaKey ||
      ev.altKey ||
      ev.shiftKey ||
      ev.repeat
    ) {
      return;
    }
    if (isTypingTarget(deepActiveElement())) {
      return;
    }
    // Stop HA's own shortcut handler from also reacting to the same keypress.
    ev.preventDefault();
    ev.stopImmediatePropagation();
    openDrawer();
  },
  true,
);
