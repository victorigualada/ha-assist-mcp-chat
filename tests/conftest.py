"""Common fixtures for the Assist MCP Chat tests.

These tests use ``pytest-homeassistant-custom-component`` (the standard test harness
for Home Assistant custom integrations). Install it with::

    pip install pytest-homeassistant-custom-component

and run with ``pytest tests_custom/assist_mcp_chat`` from the repository root.
"""

from collections.abc import Generator
from typing import Any
from unittest.mock import AsyncMock, patch

import mcp.types
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.assist_mcp_chat.const import DOMAIN
from homeassistant.const import CONF_URL

TEST_API_NAME = "ha-mcp"
MCP_SERVER_URL = "http://homeassistant.local:8099/mcp"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: Any) -> None:
    """Enable loading custom integrations in all tests."""


@pytest.fixture
def mock_setup_entry() -> Generator[AsyncMock]:
    """Override async_setup_entry."""
    with patch(
        "custom_components.assist_mcp_chat.async_setup_entry", return_value=True
    ) as mock_setup:
        yield mock_setup


@pytest.fixture
def mock_streamable_client() -> Generator[AsyncMock]:
    """Mock the streamable HTTP transport."""
    with patch(
        "custom_components.assist_mcp_chat.coordinator.streamable_http_client"
    ) as mock_client:
        mock_client.return_value.__aenter__.return_value = (
            AsyncMock(),
            AsyncMock(),
            AsyncMock(),
        )
        yield mock_client


@pytest.fixture
def mock_mcp_client(mock_streamable_client: Any) -> Generator[AsyncMock]:
    """Mock the MCP client session, yielding the session mock."""
    with (
        patch(
            "custom_components.assist_mcp_chat.coordinator.ClientSession"
        ) as mock_session,
        patch("custom_components.assist_mcp_chat.coordinator.TIMEOUT", 1),
    ):
        session = mock_session.return_value.__aenter__
        session.return_value.initialize.return_value = _server_info()
        session.return_value.list_tools.return_value = _tool_list()
        yield session


def _server_info() -> Any:
    """Return a fake initialize() response advertising the Tools capability."""
    return mcp.types.InitializeResult(
        protocolVersion="2025-03-26",
        capabilities=mcp.types.ServerCapabilities(tools=mcp.types.ToolsCapability()),
        serverInfo=mcp.types.Implementation(name=TEST_API_NAME, version="1.0"),
    )


def _tool_list() -> Any:
    """Return a fake list_tools() response with a single tool."""
    return mcp.types.ListToolsResult(
        tools=[
            mcp.types.Tool(
                name="HassTurnOn",
                description="Turn on a device",
                inputSchema={
                    "type": "object",
                    "properties": {"name": {"type": "string"}},
                },
            )
        ]
    )


@pytest.fixture(name="config_entry")
def mock_config_entry() -> MockConfigEntry:
    """Return a config entry for the integration."""
    return MockConfigEntry(
        domain=DOMAIN,
        data={CONF_URL: MCP_SERVER_URL},
        title=TEST_API_NAME,
    )
