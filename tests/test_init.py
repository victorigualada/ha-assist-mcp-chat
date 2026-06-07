"""Tests for the Assist MCP Chat setup."""

from unittest.mock import AsyncMock

import pytest

from custom_components.assist_mcp_chat.const import DOMAIN, FRONTEND_SCRIPT_URL
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import llm
from homeassistant.setup import async_setup_component

from pytest_homeassistant_custom_component.common import MockConfigEntry


@pytest.mark.usefixtures("mock_mcp_client")
async def test_setup_registers_api_and_frontend(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """Test setup registers the llm API, the tools and the frontend module."""
    assert await async_setup_component(hass, "frontend", {})
    config_entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert config_entry.state is ConfigEntryState.LOADED

    apis = llm.async_get_apis(hass)
    api = next(api for api in apis if api.id == f"{DOMAIN}-{config_entry.entry_id}")
    instance = await api.async_get_api_instance(
        llm.LLMContext(
            platform=DOMAIN,
            context=None,
            language="en",
            assistant="conversation",
            device_id=None,
        )
    )
    assert [tool.name for tool in instance.tools] == ["HassTurnOn"]

    assert FRONTEND_SCRIPT_URL in hass.data["frontend_extra_module_url"].urls


@pytest.mark.usefixtures("mock_mcp_client")
async def test_unload_entry(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """Test unloading the config entry removes the registered API."""
    assert await async_setup_component(hass, "frontend", {})
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert await hass.config_entries.async_unload(config_entry.entry_id)
    await hass.async_block_till_done()
    assert config_entry.state is ConfigEntryState.NOT_LOADED

    apis = llm.async_get_apis(hass)
    assert not any(
        api.id == f"{DOMAIN}-{config_entry.entry_id}" for api in apis
    )


async def test_setup_retries_on_connection_error(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mock_mcp_client: AsyncMock,
) -> None:
    """Test a connection failure during setup raises ConfigEntryNotReady (retry)."""
    assert await async_setup_component(hass, "frontend", {})
    mock_mcp_client.return_value.list_tools.side_effect = TimeoutError("slow")
    config_entry.add_to_hass(hass)

    assert not await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    assert config_entry.state is ConfigEntryState.SETUP_RETRY
