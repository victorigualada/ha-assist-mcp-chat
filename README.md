# Assist MCP Chat

A custom Home Assistant integration that turns Assist into an enriched, right-side
**chat drawer** backed by the unofficial
[ha-mcp](https://github.com/homeassistant-ai/ha-mcp) Model Context Protocol server.

It connects to your ha-mcp server, exposes its ~84 Home-Assistant-control tools to
Home Assistant's conversation agents as an LLM API, and replaces the centered Assist
dialog with a Markdown-rendering chat drawer — all from the standard Assist entry
points (the Assist button and the `a` keyboard shortcut), with nothing else to open.

## How it works

- **Backend (Python):** an MCP client (built on the official `mcp` SDK) connects to
  your ha-mcp server, lists its tools and registers them as an `llm.API`. No model is
  bundled — you select an LLM with your existing conversation agent.
- **Frontend (Lit):** a small prebuilt module is injected into the frontend. It
  intercepts the Assist `show-dialog` event and opens an `ha-drawer`-based chat that
  streams responses through the existing `assist_pipeline/run` WebSocket API and
  renders them with `ha-markdown`.

```
ha-mcp server ──MCP (HTTP/SSE)──▶ Assist MCP Chat ──llm.API──▶ your LLM agent ──▶ Assist
```

## Installation

1. Deploy a [ha-mcp](https://github.com/homeassistant-ai/ha-mcp) server (Home
   Assistant add-on, Docker, or standalone).
2. Copy `custom_components/assist_mcp_chat` into your Home Assistant `config/custom_components`
   directory (or install via HACS), then restart Home Assistant.
3. Go to **Settings → Devices & services → Add integration → Assist MCP Chat**.
   - If ha-mcp runs as an add-on it is **auto-discovered** — just confirm.
   - Otherwise enter the server **URL** (and an access **token** if required).
4. Point an LLM agent at the tools: edit your conversation agent (for example
   Anthropic, OpenAI, Google, or Ollama) and set its **control Home Assistant** API to
   **Assist MCP Chat**. Make sure that agent is used by your Assist pipeline.

## Configuration parameters

| Parameter | Required | Description |
| --------- | -------- | ----------- |
| URL       | Yes (manual) | Full URL of the ha-mcp MCP endpoint, e.g. `http://homeassistant.local:8099/mcp`. Discovered automatically for the add-on. |
| Access token | No | Long-lived token, only if your ha-mcp server requires authentication. |

## Use cases

- "Turn off all the downstairs lights and set the thermostat to 20°C."
- "What automations ran in the last hour, and did any fail?"
- "Create a scene from the current living-room state."

The available capabilities are whatever your ha-mcp server exposes.

## Data update

The list of available tools is refreshed from the ha-mcp server every 30 minutes and
on reload. Tool calls themselves are made on demand when the LLM invokes them.

## Known limitations

- **Frontend interception:** the drawer replaces the Assist dialog by intercepting the
  `show-dialog` event for `ha-voice-command-dialog`. If a future frontend release
  renames that dialog the bundled module needs an update.
- **Voice (STT/TTS):** the drawer is text-first; spoken input/output is not yet wired
  up (planned).
- **Auth:** token and add-on discovery are supported; OAuth is planned.

## Troubleshooting

- **No tools appear / setup retries:** confirm the URL is reachable from Home
  Assistant and that ha-mcp exposes the *Tools* capability. Check
  *Settings → Devices & services → Assist MCP Chat → Download diagnostics*.
- **`invalid_auth`:** the server requires a token, or the token is wrong.
- **The old centered dialog still opens:** hard-refresh the browser so the injected
  module reloads, and confirm the integration is configured.

## Development

The frontend lives in `frontend_src/` and builds to `frontend/entrypoint.js`:

```bash
cd frontend_src
npm install
npm run build   # outputs ../frontend/entrypoint.js
```

Backend tests use `pytest-homeassistant-custom-component`:

```bash
pip install pytest-homeassistant-custom-component
pytest tests
```
