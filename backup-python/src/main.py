"""
Tsukuras MCP Server - Main Entry Point

Session 1: Initial setup with a single 'ping' tool for connection testing.
"""

import asyncio
import logging
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from src.config import config

logging.basicConfig(
    level=getattr(logging, config.MCP_LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

server = Server(config.MCP_SERVER_NAME)


@server.list_tools()
async def list_tools() -> list[Tool]:
    """Return the list of available tools."""
    return [
        Tool(
            name="ping",
            description=(
                "A test tool that returns 'pong' along with server info. "
                "Use this to verify the MCP server is working correctly."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "Optional message to echo back",
                    }
                },
                "required": [],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls."""
    logger.info(f"Tool called: {name} with arguments: {arguments}")

    if name == "ping":
        message = arguments.get("message", "")
        response = f"pong! Server: {config.MCP_SERVER_NAME}"
        if message:
            response += f" | Echo: {message}"
        response += f"\n\nThis server provides Tsukuras construction industry data."
        response += f"\nWebsite: {config.TSUKURAS_BASE_URL}"
        return [TextContent(type="text", text=response)]

    raise ValueError(f"Unknown tool: {name}")


async def main():
    """Run the MCP server using stdio transport."""
    logger.info(f"Starting {config.MCP_SERVER_NAME}...")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
