"""The Assist MCP Chat integration.

Connects to an external ha-mcp server, exposes its tools to Home Assistant
conversation agents as an ``llm.API`` and injects a frontend module that turns the
Assist dialog into an enriched right-side chat drawer.
"""

from dataclasses import dataclass
import hashlib
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import llm

from .const import API_PROMPT, DOMAIN, FRONTEND_SCRIPT_URL, FRONTEND_URL_BASE
from .coordinator import HaMcpChatCoordinator
from .types import HaMcpChatConfigEntry

# Marker stored on hass.data once the shared frontend assets have been registered,
# so multiple config entries don't register the same static path twice.
_FRONTEND_REGISTERED = f"{DOMAIN}_frontend_registered"


def _module_hash(path: Path) -> str:
    """Return a short content hash of the frontend module for cache-busting."""
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()[:8]
    except OSError:
        return "0"


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Serve and inject the bundled frontend module exactly once."""
    if hass.data.get(_FRONTEND_REGISTERED):
        return
    hass.data[_FRONTEND_REGISTERED] = True

    module_dir = Path(__file__).parent / "frontend"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(FRONTEND_URL_BASE, str(module_dir), cache_headers=True)]
    )
    # The static path sets long, immutable cache headers, so a fixed URL would let
    # browsers serve a stale module forever. Append a content hash so the URL changes
    # whenever the bundle is rebuilt, forcing a refetch.
    version = await hass.async_add_executor_job(
        _module_hash, module_dir / "entrypoint.js"
    )
    frontend.add_extra_js_url(hass, f"{FRONTEND_SCRIPT_URL}?v={version}")


async def async_setup_entry(
    hass: HomeAssistant, entry: HaMcpChatConfigEntry
) -> bool:
    """Set up Assist MCP Chat from a config entry."""
    await _async_register_frontend(hass)

    coordinator = HaMcpChatCoordinator(hass, entry)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator

    unsub = llm.async_register_api(
        hass,
        HaMcpChatAPI(
            hass=hass,
            id=f"{DOMAIN}-{entry.entry_id}",
            name=entry.title,
            coordinator=coordinator,
        ),
    )
    entry.async_on_unload(unsub)

    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: HaMcpChatConfigEntry
) -> bool:
    """Unload a config entry.

    The injected frontend assets are intentionally left registered: they are shared
    across entries and harmless when no entry is configured.
    """
    return True


@dataclass(kw_only=True)
class HaMcpChatAPI(llm.API):
    """Expose the ha-mcp server's tools to Home Assistant conversation agents."""

    coordinator: HaMcpChatCoordinator

    async def async_get_api_instance(
        self, llm_context: llm.LLMContext
    ) -> llm.APIInstance:
        """Return an instance of the API bound to the given context."""
        return llm.APIInstance(
            self,
            API_PROMPT.format(name=self.name),
            llm_context,
            tools=self.coordinator.data,
        )


@callback
def async_remove_entry(hass: HomeAssistant, entry: HaMcpChatConfigEntry) -> None:
    """Remove the injected frontend module when the last entry is removed."""
    if hass.config_entries.async_entries(DOMAIN):
        return
    if not hass.data.pop(_FRONTEND_REGISTERED, False):
        return
    frontend.remove_extra_js_url(hass, FRONTEND_SCRIPT_URL)
