"""Config flow for the Assist MCP Chat integration."""

import logging
from typing import Any

import httpx
import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import CONF_TOKEN, CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.service_info.hassio import HassioServiceInfo

from .const import DOMAIN
from .coordinator import TokenManager, mcp_client

_LOGGER = logging.getLogger(__name__)

STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_URL): str,
        vol.Optional(CONF_TOKEN): str,
    }
)

EXAMPLE_URL = "http://homeassistant.local:8099/mcp"


def _token_manager(token: str | None) -> TokenManager | None:
    """Build a token manager from a static token."""
    if not token:
        return None

    async def token_manager() -> str:
        return token

    return token_manager


async def validate_input(
    hass: HomeAssistant, url: str, token: str | None
) -> dict[str, Any]:
    """Validate the URL and connect to the ha-mcp server."""
    try:
        cv.url(url)
    except vol.Invalid as error:
        raise InvalidUrl from error

    try:
        async with mcp_client(hass, url, _token_manager(token)) as session:
            response = await session.initialize()
    except httpx.TimeoutException as error:
        raise TimeoutConnectError from error
    except httpx.HTTPStatusError as error:
        if error.response.status_code == 401:
            raise InvalidAuth from error
        raise CannotConnect from error
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

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle a connection configured manually (Docker/standalone/remote)."""
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                info = await validate_input(
                    self.hass, user_input[CONF_URL], user_input.get(CONF_TOKEN)
                )
            except InvalidUrl:
                errors[CONF_URL] = "invalid_url"
            except TimeoutConnectError:
                errors["base"] = "timeout_connect"
            except InvalidAuth:
                errors["base"] = "invalid_auth"
            except CannotConnect:
                errors["base"] = "cannot_connect"
            except MissingCapabilities:
                return self.async_abort(reason="missing_capabilities")
            except Exception:
                _LOGGER.exception("Unexpected exception")
                errors["base"] = "unknown"
            else:
                self._async_abort_entries_match({CONF_URL: user_input[CONF_URL]})
                return self.async_create_entry(title=info["title"], data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=STEP_USER_DATA_SCHEMA,
            errors=errors,
            description_placeholders={"example_url": EXAMPLE_URL},
        )

    async def async_step_hassio(
        self, discovery_info: HassioServiceInfo
    ) -> ConfigFlowResult:
        """Handle discovery of the ha-mcp add-on.

        When ha-mcp runs as a Home Assistant add-on it advertises its connection
        details over Supervisor discovery, letting us connect over the internal
        network without the user entering a URL or token.
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
                info = await validate_input(self.hass, self._discovered_url, None)
            except TimeoutConnectError:
                errors["base"] = "timeout_connect"
            except InvalidAuth:
                errors["base"] = "invalid_auth"
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


class InvalidAuth(HomeAssistantError):
    """Error to indicate the provided token is invalid."""


class MissingCapabilities(HomeAssistantError):
    """Error to indicate the server does not expose the Tools capability."""
