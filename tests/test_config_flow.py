"""Tests for the Assist MCP Chat config flow."""

from typing import Any
from unittest.mock import AsyncMock

import httpx
import pytest

from custom_components.assist_mcp_chat.const import DOMAIN
from homeassistant.config_entries import SOURCE_HASSIO, SOURCE_USER
from homeassistant.const import CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers.service_info.hassio import HassioServiceInfo

from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import MCP_SERVER_URL, TEST_API_NAME


@pytest.mark.usefixtures("mock_mcp_client", "mock_setup_entry")
async def test_user_flow_success(hass: HomeAssistant) -> None:
    """Test a successful manual (URL) config flow."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: MCP_SERVER_URL}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == TEST_API_NAME
    assert result["data"] == {CONF_URL: MCP_SERVER_URL}


@pytest.mark.usefixtures("mock_mcp_client")
async def test_user_flow_duplicate(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """Test that the same server cannot be configured twice."""
    config_entry.add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: MCP_SERVER_URL}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


@pytest.mark.parametrize(
    ("side_effect", "expected_error"),
    [
        (httpx.ConnectError("boom"), "cannot_connect"),
        (httpx.TimeoutException("slow"), "timeout_connect"),
        (
            httpx.HTTPStatusError(
                "unauthorized",
                request=httpx.Request("GET", MCP_SERVER_URL),
                response=httpx.Response(401),
            ),
            "invalid_auth",
        ),
    ],
    ids=["cannot_connect", "timeout", "invalid_auth"],
)
async def test_user_flow_connection_errors(
    hass: HomeAssistant,
    mock_mcp_client: AsyncMock,
    side_effect: Exception,
    expected_error: str,
) -> None:
    """Test connection errors surface the right form error."""
    mock_mcp_client.return_value.initialize.side_effect = side_effect
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: MCP_SERVER_URL}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"]["base"] == expected_error


async def test_user_flow_invalid_url(hass: HomeAssistant) -> None:
    """Test an invalid URL is rejected before connecting."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: "not-a-url"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"][CONF_URL] == "invalid_url"


@pytest.mark.usefixtures("mock_mcp_client", "mock_setup_entry")
async def test_hassio_discovery_flow(hass: HomeAssistant) -> None:
    """Test the add-on discovery flow connects without a token."""
    discovery = HassioServiceInfo(
        config={CONF_URL: MCP_SERVER_URL},
        name="ha-mcp",
        slug="ha_mcp",
        uuid="1234",
    )
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_HASSIO}, data=discovery
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "hassio_confirm"

    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"] == {CONF_URL: MCP_SERVER_URL}


async def test_hassio_discovery_invalid_info(hass: HomeAssistant) -> None:
    """Test discovery without connection details aborts cleanly."""
    discovery = HassioServiceInfo(
        config={}, name="ha-mcp", slug="ha_mcp", uuid="1234"
    )
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_HASSIO}, data=discovery
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "invalid_discovery_info"
