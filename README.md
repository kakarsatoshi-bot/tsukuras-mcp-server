# Tsukuras MCP Server

MCP (Model Context Protocol) server providing Tsukuras construction industry data to AI agents like Claude, ChatGPT, and Gemini.

## Status

Session 1: Initial setup - Skeleton with a single `ping` tool for testing.

## Features (Planned)

- **search_companies**: Search Hokkaido construction companies by area and work category
- **get_area_stats**: Get construction industry statistics by municipality
- **get_work_category**: Get work category descriptions and company counts

## Setup (Development on Windows)

### Prerequisites

- Python 3.11+
- uv (Python package manager)
- Claude Desktop (for testing)
- PowerShell

### Installation

```powershell
git clone <repo-url>
cd tsukuras-mcp-server

uv venv
.\.venv\Scripts\Activate.ps1
uv sync

Copy-Item .env.example .env
```

### Running Locally

```powershell
python -m src.main
```

### Connecting to Claude Desktop

Edit `claude_desktop_config.json` at `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tsukuras": {
      "command": "D:\\projects\\tsukuras-mcp-server\\.venv\\Scripts\\python.exe",
      "args": ["-m", "src.main"],
      "cwd": "D:\\projects\\tsukuras-mcp-server"
    }
  }
}
```

Restart Claude Desktop and the `ping` tool should be available.

## Project Structure

```
tsukuras-mcp-server/
├── src/
│   ├── main.py           # MCP server entry point
│   ├── config.py         # Configuration
│   ├── tools/            # MCP tool implementations
│   ├── db/               # Database clients
│   └── utils/            # Shared utilities
├── tests/                # Unit tests
├── docs/                 # Documentation
└── pyproject.toml        # Project metadata
```

## Related Projects

- [Tsukuras](https://tsukuras.jp) - Hokkaido construction industry database & media

## License

TBD
