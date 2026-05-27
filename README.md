# Tsukuras MCP Server

> Access Hokkaido's construction industry database through AI agents like Claude, ChatGPT, and Gemini.

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

## Overview

Tsukuras MCP Server provides structured data about **7,400+ construction companies** across **179 municipalities** in Hokkaido, Japan — accessible directly from AI assistants via the Model Context Protocol (MCP).

**Powered by [Tsukuras](https://tsukuras.jp)** — the Hokkaido construction industry database & media.

## Available Tools

### 🔍 `search_companies`
Search construction companies by area and/or work category.

**Parameters:**
- `area` (optional): Municipality name in Japanese (e.g., `旭川市`, `札幌市`)
- `work_category` (optional): Work category slug (e.g., `paving`, `general-civil`)
- `limit` (optional): Max results, default 10, max 50

**Example prompts:**
- "Show me 5 construction companies in Asahikawa"
- "Find companies that do paving work in Hokkaido"

---

### 📊 `get_area_stats`
Get construction industry statistics for a specific municipality.

**Parameters:**
- `area` (required): Municipality name in Japanese (e.g., `旭川市`)

**Example prompts:**
- "What is the construction industry overview of Asahikawa?"
- "How many construction companies are in Sapporo?"

---

### 🏗️ `get_work_category`
Get detailed information about a construction work category.

**Parameters:**
- `work_category` (required): Slug or Japanese name (e.g., `paving` or `舗装工事`)

**Example prompts:**
- "What is paving work?"
- "Tell me about general civil engineering"

---

### 🏓 `ping`
Test the server connection.

---

## Work Category Slugs

| Slug | Japanese | English |
|------|----------|---------|
| `general-civil` | 土木一般 | General Civil Engineering |
| `building` | 建築工事 | Building Construction |
| `paving` | 舗装工事 | Paving Work |
| `steel-bridge` | 鋼橋 | Steel Bridge |
| `pipe` | 管工事 | Pipe Work |
| `road-sign` | 道路標識 | Road Sign |
| `landscaping` | 造園 | Landscaping |

## Quick Start

### Connect via Claude Desktop

Connect directly via the Tsukuras remote MCP URL:

```
https://tsukuras-mcp-server.tsukuras-jp.workers.dev/mcp
```

### Health Check

```bash
curl https://tsukuras-mcp-server.tsukuras-jp.workers.dev/health
```

Response:
```json
{
  "status": "ok",
  "server": "tsukuras-mcp-server",
  "version": "0.3.0",
  "tools": ["ping", "search_companies", "get_area_stats", "get_work_category"],
  "website": "https://tsukuras.jp"
}
```

## Data Coverage

| Category | Count |
|----------|-------|
| Construction companies | 7,400+ |
| Municipalities | 179 |
| Work categories | 16 |
| Prefecture | Hokkaido, Japan |

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Protocol**: MCP (Model Context Protocol) via `agents` + `@modelcontextprotocol/sdk`
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript

## Related

- 🌐 [Tsukuras Website](https://tsukuras.jp) — Hokkaido construction industry database
- 📖 [MCP Documentation](https://modelcontextprotocol.io/)

## License

MIT
