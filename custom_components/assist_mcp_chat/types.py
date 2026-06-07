"""Types for the Assist MCP Chat integration."""

from homeassistant.config_entries import ConfigEntry

from .coordinator import HaMcpChatCoordinator

type HaMcpChatConfigEntry = ConfigEntry[HaMcpChatCoordinator]
