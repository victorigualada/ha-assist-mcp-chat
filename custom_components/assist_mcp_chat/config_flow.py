"""Config flow for the Assist MCP Chat integration."""

import logging
from typing import Any

import httpx
import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN
from .coordinator import mcp_client

_LOGGER = logging.getLogger(__name__)

EXAMPLE_URL = "http://homeassistant.local:9583"
EXAMPLE_SECRET = "/private_xxxxxxxxxxxxxxxx"
CONF_SECRET_PATH = "secret_path"

# The ha-mcp add-on binds this fixed port on the host network.
ADDON_PORT = 9583
# Substring of the installed add-on slug (Supervisor prefixes a repository id).
ADDON_SLUG = "ha_mcp"
# One-click "add the ha-mcp add-on repository" link, shown when it isn't installed.
INSTALL_URL = (
    "https://my.home-assistant.io/redirect/supervisor_add_addon_repository/"
    "?repository_url=https%3A%2F%2Fgithub.com%2Fhomeassistant-ai%2Fha-mcp"
)


def _compose_url(base: str, secret: str) -> str:
    """Join the base server URL with the optional secret path segment."""
    base = base.strip().rstrip("/")
    secret = secret.strip()
    if not secret:
        return base
    if not secret.startswith("/"):
        secret = f"/{secret}"
    return f"{base}{secret}"


async def _async_addon_state(hass: HomeAssistant) -> tuple[str | None, bool]:
    """Detect the ha-mcp add-on under Supervisor.

    Returns ``(base_url, show_install_hint)``:
    - ``base_url`` prefills scheme/host/port when the add-on is installed. The
      secret path is private to the add-on, so the user still supplies that; a
      wrong host guess is harmless since the URL stays editable and is validated.
    - ``show_install_hint`` is True when we're on Supervisor but the add-on isn't
      installed, so the form can offer a one-click install link.
    """
    try:
        from homeassistant.components.hassio import is_hassio
    except ImportError:
        return None, False
    if not is_hassio(hass):
        return None, False

    try:
        from homeassistant.components.hassio.handler import get_supervisor_client

        client = get_supervisor_client(hass)
        addons = await client.addons.list()
        addon = next((a for a in addons if ADDON_SLUG in a.slug), None)
        if addon is None:
            return None, True
        info = await client.addons.addon_info(addon.slug)
        host = getattr(info, "hostname", None) or "homeassistant.local"
        return f"http://{host}:{ADDON_PORT}", False
    except Exception:  # noqa: BLE001 - best-effort detection
        _LOGGER.debug("ha-mcp add-on detection failed", exc_info=True)
        return None, False


async def validate_input(hass: HomeAssistant, url: str) -> dict[str, Any]:
    """Validate the URL and connect to the ha-mcp server."""
    try:
        cv.url(url)
    except vol.Invalid as error:
        raise InvalidUrl from error

    try:
        async with mcp_client(hass, url) as session:
            response = await session.initialize()
    except httpx.TimeoutException as error:
        raise TimeoutConnectError from error
    except httpx.HTTPError as error:
        raise CannotConnect from error

    if not response.capabilities.tools:
        raise MissingCapabilities

    return {"title": response.serverInfo.name}


class HaMcpChatConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Assist MCP Chat."""

    VERSION = 1

    def __init__(self) -> None:
        """Initialize the config flow."""
        self._default_url = ""
        self._show_install_hint = False
        self._detected = False

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Connect manually, or to the local ha-mcp add-on with a prefilled URL."""
        errors: dict[str, str] = {}
        if user_input is not None:
            url = _compose_url(
                user_input.get(CONF_URL, ""), user_input.get(CONF_SECRET_PATH, "")
            )
            try:
                info = await validate_input(self.hass, url)
            except InvalidUrl:
                errors[CONF_URL] = "invalid_url"
            except TimeoutConnectError:
                errors["base"] = "timeout_connect"
            except CannotConnect:
                errors["base"] = "cannot_connect"
            except MissingCapabilities:
                return self.async_abort(reason="missing_capabilities")
            except Exception:
                _LOGGER.exception("Unexpected exception")
                errors["base"] = "unknown"
            else:
                self._async_abort_entries_match({CONF_URL: url})
                return self.async_create_entry(
                    title=info["title"], data={CONF_URL: url}
                )

        if not self._detected:
            self._default_url, self._show_install_hint = await _async_addon_state(
                self.hass
            )
            self._default_url = self._default_url or ""
            self._detected = True
        prior = user_input or {}
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_URL, default=prior.get(CONF_URL, self._default_url)
                ): str,
                vol.Optional(
                    CONF_SECRET_PATH, default=prior.get(CONF_SECRET_PATH, "")
                ): str,
            }
        )
        addon_hint = ""
        if self._show_install_hint:
            addon_hint = (
                "\n\n**Don't have the ha-mcp add-on yet?** "
                f"[Add it to Home Assistant]({INSTALL_URL})"
            )
        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
            description_placeholders={
                "example_url": EXAMPLE_URL,
                "example_path": EXAMPLE_SECRET,
                "addon_hint": addon_hint,
            },
        )


class InvalidUrl(HomeAssistantError):
    """Error to indicate the URL format is invalid."""


class CannotConnect(HomeAssistantError):
    """Error to indicate we cannot connect."""


class TimeoutConnectError(HomeAssistantError):
    """Error to indicate a timeout while connecting."""


class MissingCapabilities(HomeAssistantError):
    """Error to indicate the server does not expose the Tools capability."""
