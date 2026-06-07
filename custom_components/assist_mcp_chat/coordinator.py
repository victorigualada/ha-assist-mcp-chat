"""Coordinator for the Assist MCP Chat integration.

This connects to an external ha-mcp server (https://github.com/homeassistant-ai/ha-mcp)
as a Model Context Protocol client, fetches the tools it exposes and wraps them as
``llm.Tool`` instances so any Home Assistant conversation agent can call them.

The MCP transport handling mirrors Home Assistant's built-in ``mcp`` integration,
which is the reviewed reference implementation for talking to a remote MCP server.
"""

import asyncio
from collections.abc import AsyncGenerator, Awaitable, Callable
from contextlib import asynccontextmanager
import logging

import httpx
from mcp import McpError
from mcp.client.session import ClientSession
from mcp.client.sse import sse_client
from mcp.client.streamable_http import streamable_http_client
import voluptuous as vol
from voluptuous_openapi import convert_to_voluptuous

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_TOKEN, CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed, HomeAssistantError
from homeassistant.helpers import llm
from homeassistant.helpers.httpx_client import create_async_httpx_client
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util.json import JsonObjectType

from .const import DOMAIN, TIMEOUT, UPDATE_INTERVAL

_LOGGER = logging.getLogger(__name__)

type TokenManager = Callable[[], Awaitable[str]]


@asynccontextmanager
async def mcp_client(
    hass: HomeAssistant,
    url: str,
    token_manager: TokenManager | None = None,
) -> AsyncGenerator[ClientSession]:
    """Create an MCP client session for the ha-mcp server.

    Streamable HTTP is attempted first; a 405 (or generic ``McpError``) is the
    documented signal in the MCP transport spec that the server only speaks the
    older SSE transport, so we fall back to it.
    """
    headers: dict[str, str] = {}
    if token_manager is not None:
        token = await token_manager()
        headers["Authorization"] = f"Bearer {token}"

    try:
        async with (
            streamable_http_client(
                url=url,
                http_client=create_async_httpx_client(hass, headers=headers),
            ) as (read_stream, write_stream, _),
            ClientSession(read_stream, write_stream) as session,
        ):
            await session.initialize()
            yield session
    except ExceptionGroup as streamable_err:
        main_error = streamable_err.exceptions[0]
        if (
            isinstance(main_error, httpx.HTTPStatusError)
            and main_error.response.status_code == 405
        ) or isinstance(main_error, McpError):
            _LOGGER.debug(
                "Streamable HTTP client failed, attempting SSE client: %s", main_error
            )
            try:
                async with (
                    sse_client(url=url, headers=headers) as streams,
                    ClientSession(*streams) as session,
                ):
                    await session.initialize()
                    yield session
            except ExceptionGroup as sse_err:
                _LOGGER.debug("Error creating SSE MCP client: %s", sse_err)
                raise sse_err.exceptions[0] from sse_err
        else:
            _LOGGER.debug("Error creating MCP client: %s", streamable_err)
            raise main_error from streamable_err


def token_manager_from_entry(entry: ConfigEntry) -> TokenManager | None:
    """Return a token manager for the config entry, or None when unauthenticated.

    ha-mcp running as a Home Assistant add-on is reached over the internal network
    and may not require a bearer token, in which case no token is stored.
    """
    token = entry.data.get(CONF_TOKEN)
    if not token:
        return None

    async def token_manager() -> str:
        return token

    return token_manager


class HaMcpChatTool(llm.Tool):
    """A tool exposed by the ha-mcp server."""

    def __init__(
        self,
        name: str,
        description: str | None,
        parameters: vol.Schema,
        server_url: str,
        token_manager: TokenManager | None = None,
    ) -> None:
        """Initialize the tool."""
        self.name = name
        self.description = description
        self.parameters = parameters
        self.server_url = server_url
        self.token_manager = token_manager

    async def async_call(
        self,
        hass: HomeAssistant,
        tool_input: llm.ToolInput,
        llm_context: llm.LLMContext,
    ) -> JsonObjectType:
        """Call the tool on the ha-mcp server."""
        try:
            async with (
                asyncio.timeout(TIMEOUT),
                mcp_client(hass, self.server_url, self.token_manager) as session,
            ):
                result = await session.call_tool(
                    tool_input.tool_name, tool_input.tool_args
                )
        except TimeoutError as error:
            raise HomeAssistantError(f"Timeout when calling tool: {error}") from error
        except httpx.HTTPStatusError as error:
            raise HomeAssistantError(f"Error when calling tool: {error}") from error
        return result.model_dump(exclude_unset=True, exclude_none=True)


class HaMcpChatCoordinator(DataUpdateCoordinator[list[llm.Tool]]):
    """Fetch and cache the tools exposed by the ha-mcp server."""

    config_entry: ConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        config_entry: ConfigEntry,
        token_manager: TokenManager | None = None,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            logger=_LOGGER,
            name=DOMAIN,
            config_entry=config_entry,
            update_interval=UPDATE_INTERVAL,
        )
        self.token_manager = token_manager

    async def _async_update_data(self) -> list[llm.Tool]:
        """Fetch the tool list from the ha-mcp server."""
        try:
            async with (
                asyncio.timeout(TIMEOUT),
                mcp_client(
                    self.hass,
                    self.config_entry.data[CONF_URL],
                    self.token_manager,
                ) as session,
            ):
                result = await session.list_tools()
        except TimeoutError as error:
            raise UpdateFailed(f"Timeout when listing tools: {error}") from error
        except httpx.HTTPStatusError as error:
            if error.response.status_code == 401 and self.token_manager is not None:
                raise ConfigEntryAuthFailed(
                    "The ha-mcp server requires authentication"
                ) from error
            raise UpdateFailed(f"Error communicating with ha-mcp: {error}") from error
        except httpx.HTTPError as err:
            raise UpdateFailed(f"Error communicating with ha-mcp: {err}") from err

        tools: list[llm.Tool] = []
        for tool in result.tools:
            try:
                parameters = convert_to_voluptuous(tool.inputSchema)
            except Exception as err:
                raise UpdateFailed(
                    f"Error converting schema {err}: {tool.inputSchema}"
                ) from err
            tools.append(
                HaMcpChatTool(
                    tool.name,
                    tool.description,
                    parameters,
                    self.config_entry.data[CONF_URL],
                    self.token_manager,
                )
            )
        return tools
