"""Configuration management for Tsukuras MCP Server."""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration."""

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_READONLY_KEY: str = os.getenv("SUPABASE_READONLY_KEY", "")

    MCP_SERVER_NAME: str = os.getenv("MCP_SERVER_NAME", "tsukuras-mcp-server")
    MCP_LOG_LEVEL: str = os.getenv("MCP_LOG_LEVEL", "INFO")

    TSUKURAS_BASE_URL: str = "https://tsukuras.jp"


config = Config()
