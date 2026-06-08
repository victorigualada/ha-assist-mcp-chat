"""Tests for the Assist MCP Chat config flow."""

from unittest.mock import AsyncMock, patch

import httpx
import mcp.types
import pytest

from custom_components.assist_mcp_chat.config_flow import CONF_SECRET_PATH, INSTALL_URL
from custom_components.assist_mcp_chat.const import DOMAIN
from homeassistant.config_entries import SOURCE_USER
from homeassistant.const import CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import MCP_SERVER_URL, TEST_API_NAME

# Add-on detection helper, patched per-test to simulate Supervisor environments.
DETECT = "custom_components.assist_mcp_chat.config_flow._async_addon_state"


async def _start(hass: HomeAssistant):
    """Start a user-initiated config flow."""
    return await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )


@pytest.mark.usefixtures("mock_mcp_client", "mock_setup_entry")
async def test_user_flow_success(hass: HomeAssistant) -> None:
    """A successful manual (URL only) config flow."""
    result = await _start(hass)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: MCP_SERVER_URL}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == TEST_API_NAME
    assert result["data"] == {CONF_URL: MCP_SERVER_URL}


@pytest.mark.usefixtures("mock_mcp_client", "mock_setup_entry")
async def test_user_flow_composes_secret_path(hass: HomeAssistant) -> None:
    """The base URL and secret path are joined into the stored URL."""
    result = await _start(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            CONF_URL: "http://homeassistant.local:9583",
            CONF_SECRET_PATH: "private_abc",
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"] == {CONF_URL: "http://homeassistant.local:9583/private_abc"}


@pytest.mark.usefixtures("mock_mcp_client", "mock_setup_entry")
async def test_user_flow_prefills_detected_addon(hass: HomeAssistant) -> None:
    """When the add-on is detected the URL is prefilled and no install hint shows."""
    base = "http://ha-mcp:9583"
    with patch(DETECT, AsyncMock(return_value=(base, False))):
        result = await _start(hass)
    assert result["type"] is FlowResultType.FORM
    assert result["data_schema"]({})[CONF_URL] == base
    assert result["description_placeholders"]["addon_hint"] == ""


async def test_user_flow_shows_install_hint(hass: HomeAssistant) -> None:
    """On Supervisor without the add-on, the install link is offered."""
    with patch(DETECT, AsyncMock(return_value=(None, True))):
        result = await _start(hass)
    assert result["type"] is FlowResultType.FORM
    assert result["data_schema"]({})[CONF_URL] == ""
    assert INSTALL_URL in result["description_placeholders"]["addon_hint"]


@pytest.mark.usefixtures("mock_mcp_client")
async def test_user_flow_duplicate(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """The same server cannot be configured twice."""
    config_entry.add_to_hass(hass)
    result = await _start(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: MCP_SERVER_URL}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_user_flow_invalid_url(hass: HomeAssistant) -> None:
    """An invalid URL is rejected before connecting."""
    result = await _start(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: "not-a-url"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"][CONF_URL] == "invalid_url"


@pytest.mark.parametrize(
    ("side_effect", "expected_error"),
    [
        (httpx.ConnectError("boom"), "cannot_connect"),
        (httpx.TimeoutException("slow"), "timeout_connect"),
        (
            httpx.HTTPStatusError(
                "nope",
                request=httpx.Request("GET", MCP_SERVER_URL),
                response=httpx.Response(401),
            ),
            "cannot_connect",
        ),
    ],
    ids=["cannot_connect", "timeout", "http_error"],
)
async def test_user_flow_connection_errors(
    hass: HomeAssistant,
    mock_mcp_client: AsyncMock,
    side_effect: Exception,
    expected_error: str,
) -> None:
    """Connection errors surface the right form error."""
    mock_mcp_client.return_value.initialize.side_effect = side_effect
    result = await _start(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: MCP_SERVER_URL}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"]["base"] == expected_error


async def test_user_flow_missing_capabilities(
    hass: HomeAssistant, mock_mcp_client: AsyncMock
) -> None:
    """A server that exposes no tools aborts."""
    mock_mcp_client.return_value.initialize.return_value = mcp.types.InitializeResult(
        protocolVersion="2025-03-26",
        capabilities=mcp.types.ServerCapabilities(tools=None),
        serverInfo=mcp.types.Implementation(name=TEST_API_NAME, version="1.0"),
    )
    result = await _start(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: MCP_SERVER_URL}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "missing_capabilities"


async def test_addon_base_url_uses_internal_host(hass: HomeAssistant) -> None:
    """The prefill host is derived from HA's internal URL, not hardcoded."""
    from custom_components.assist_mcp_chat.config_flow import _addon_base_url

    await hass.config.async_update(internal_url="http://192.168.1.50:8123")
    assert _addon_base_url(hass) == "http://192.168.1.50:9583"


async def test_addon_base_url_ignores_nabu_casa(hass: HomeAssistant) -> None:
    """An external / Nabu Casa URL must never leak into the prefilled base."""
    from custom_components.assist_mcp_chat.config_flow import _addon_base_url

    await hass.config.async_update(
        internal_url="http://homeassistant.local:8123",
        external_url="https://abcdef.ui.nabu.casa",
    )
    base = _addon_base_url(hass)
    assert "nabu.casa" not in base
    assert base == "http://homeassistant.local:9583"


async def test_user_flow_unknown_error(
    hass: HomeAssistant, mock_mcp_client: AsyncMock
) -> None:
    """An unexpected error surfaces as 'unknown'."""
    mock_mcp_client.return_value.initialize.side_effect = ValueError("boom")
    result = await _start(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: MCP_SERVER_URL}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"]["base"] == "unknown"
