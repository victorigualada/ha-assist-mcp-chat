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
from homeassistant.helpers.service_info.hassio import HassioServiceInfo

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


def _compose_url(base: str, secret: str) -> str:
    """Join the base server URL with the optional secret path segment."""
    base = base.strip().rstrip("/")
    secret = secret.strip()
    if not secret:
        return base
    if not secret.startswith("/"):
        secret = f"/{secret}"
    return f"{base}{secret}"


async def _async_addon_base_url(hass: HomeAssistant) -> str | None:
    """Best-effort base URL of the ha-mcp add-on under Supervisor.

    The add-on's secret path is private to it, so the user still supplies that;
    we only prefill scheme/host/port. A wrong guess is harmless — the URL field
    stays editable and the connection is validated before the entry is created.
    """
    try:
        from homeassistant.components.hassio import is_hassio
    except ImportError:
        return None
    if not is_hassio(hass):
        return None

    host = "homeassistant.local"
    try:
        from homeassistant.components.hassio.handler import get_supervisor_client

        client = get_supervisor_client(hass)
        addons = await client.addons.list()
        addon = next((a for a in addons if ADDON_SLUG in a.slug), None)
        if addon is not None:
            info = await client.addons.addon_info(addon.slug)
            host = getattr(info, "hostname", None) or host
    except Exception:  # noqa: BLE001 - best-effort; fall back to the default host
        _LOGGER.debug("ha-mcp add-on detection failed", exc_info=True)

    return f"http://{host}:{ADDON_PORT}"


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
        self._discovered_url: str | None = None
        self._discovered_title: str | None = None
        self._default_url: str | None = None

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

        if self._default_url is None:
            self._default_url = await _async_addon_base_url(self.hass) or ""
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
        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
            description_placeholders={
                "example_url": EXAMPLE_URL,
                "example_path": EXAMPLE_SECRET,
            },
        )

    async def async_step_hassio(
        self, discovery_info: HassioServiceInfo
    ) -> ConfigFlowResult:
        """Handle discovery of the ha-mcp add-on.

        When ha-mcp runs as a Home Assistant add-on it advertises its connection
        details over Supervisor discovery, letting us connect over the internal
        network without the user entering a URL.
        """
        config = discovery_info.config
        url = config.get(CONF_URL)
        if url is None and (host := config.get("host")):
            scheme = config.get("ssl") and "https" or "http"
            url = f"{scheme}://{host}:{config.get('port', 80)}{config.get('path', '/mcp')}"
        if url is None:
            return self.async_abort(reason="invalid_discovery_info")

        await self.async_set_unique_id(discovery_info.uuid or discovery_info.slug)
        self._abort_if_unique_id_configured(updates={CONF_URL: url})
        self._async_abort_entries_match({CONF_URL: url})

        self._discovered_url = url
        self._discovered_title = discovery_info.name
        self.context["title_placeholders"] = {"name": discovery_info.name}
        return await self.async_step_hassio_confirm()

    async def async_step_hassio_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Confirm adding the discovered ha-mcp add-on."""
        assert self._discovered_url is not None
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                info = await validate_input(self.hass, self._discovered_url)
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
                return self.async_create_entry(
                    title=info["title"] or self._discovered_title or "ha-mcp",
                    data={CONF_URL: self._discovered_url},
                )

        return self.async_show_form(
            step_id="hassio_confirm",
            errors=errors,
            description_placeholders={"name": self._discovered_title or "ha-mcp"},
        )


class InvalidUrl(HomeAssistantError):
    """Error to indicate the URL format is invalid."""


class CannotConnect(HomeAssistantError):
    """Error to indicate we cannot connect."""


class TimeoutConnectError(HomeAssistantError):
    """Error to indicate a timeout while connecting."""


class MissingCapabilities(HomeAssistantError):
    """Error to indicate the server does not expose the Tools capability."""
