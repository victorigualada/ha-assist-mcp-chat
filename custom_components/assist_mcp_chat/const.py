"""Constants for the Assist MCP Chat integration."""

import datetime

DOMAIN = "assist_mcp_chat"

# URL path the bundled frontend module is served from and injected into the
# Home Assistant frontend via frontend.add_extra_js_url.
FRONTEND_URL_BASE = "/assist_mcp_chat_frontend"
FRONTEND_SCRIPT_URL = f"{FRONTEND_URL_BASE}/entrypoint.js"

# How often the list of tools exposed by the ha-mcp server is refreshed.
UPDATE_INTERVAL = datetime.timedelta(minutes=30)

# Timeout, in seconds, for individual calls to the ha-mcp server.
TIMEOUT = 10

# Prompt prepended to the tool list so the LLM knows where the tools come from.
API_PROMPT = (
    "The following tools are provided by the ha-mcp server '{name}' and let you "
    "control and inspect this Home Assistant instance."
)
