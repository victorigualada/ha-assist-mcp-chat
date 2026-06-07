import "./assist-mcp-chat-drawer";
import type { AssistMcpChatDrawer } from "./assist-mcp-chat-drawer";

// The centered Assist dialog is always opened through a "show-dialog" event with
// this dialogTag (the Assist button and the "a" keyboard shortcut both route through
// it). Intercepting that single event re-routes every Assist entry point to our
// right-side drawer without patching any core frontend code.
const ASSIST_DIALOG_TAG = "ha-voice-command-dialog";
const DRAWER_TAG = "assist-mcp-chat-drawer";

let drawer: AssistMcpChatDrawer | undefined;

const getHomeAssistant = (): (HTMLElement & { hass?: any }) | null =>
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
  true
);
