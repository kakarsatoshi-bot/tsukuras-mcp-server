/**
 * Tsukuras MCP Server v0.2.0
 * Session 2-B: search_companies + get_area_stats を追加
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

import { pingToolDefinition, handlePing } from "./tools/ping";
import { handleSearchCompanies } from "./tools/search_companies";
import { handleGetAreaStats } from "./tools/get_area_stats";

export interface Env {
  TsukurasMcpAgent: DurableObjectNamespace;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export class TsukurasMcpAgent extends McpAgent<Env> {
  server = new McpServer({ name: "tsukuras-mcp-server", version: "0.2.0" });

  async init() {
    const supabase = createClient(
      this.env.SUPABASE_URL,
      this.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // ping
    this.server.registerTool(
      pingToolDefinition.name,
      {
        description: pingToolDefinition.description,
        inputSchema: { message: z.string().optional() },
      },
      async ({ message }) => ({
        content: [{ type: "text", text: await handlePing({ message }) }],
      })
    );

    // search_companies
    this.server.registerTool(
      "search_companies",
      {
        description:
          "北海道の建設業企業を地域・工事カテゴリで検索します。" +
          "地域名（市町村名）または工事カテゴリslugのどちらかは必須です。" +
          "例：旭川市の舗装工事会社を最大10社返します。",
        inputSchema: {
          area: z.string().optional().describe("市町村名（例：旭川市、札幌市、帯広市）"),
          work_category: z.string().optional().describe("工事カテゴリのslug（例：paving=舗装工事）"),
          limit: z.number().optional().describe("返す件数の上限（デフォルト10、最大50）"),
        },
      },
      async ({ area, work_category, limit }) => ({
        content: [
          {
            type: "text",
            text: await handleSearchCompanies({ area, work_category, limit }, supabase),
          },
        ],
      })
    );

    // get_area_stats
    this.server.registerTool(
      "get_area_stats",
      {
        description:
          "北海道の特定の市町村における建設業の統計情報を取得します。" +
          "企業数、人口、証拠強度の内訳などのサマリーを返します。",
        inputSchema: {
          area: z.string().describe("市町村名（例：旭川市、札幌市、帯広市）"),
        },
      },
      async ({ area }) => ({
        content: [{ type: "text", text: await handleGetAreaStats({ area }, supabase) }],
      })
    );
  }
}

const mcpHandler = TsukurasMcpAgent.serve("/mcp", {
  binding: "TsukurasMcpAgent",
});

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          server: "tsukuras-mcp-server",
          version: "0.2.0",
          tools: ["ping", "search_companies", "get_area_stats"],
          website: "https://tsukuras.jp",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          name: "Tsukuras MCP Server",
          version: "0.2.0",
          mcp_endpoint: "/mcp",
          health_endpoint: "/health",
          website: "https://tsukuras.jp",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return mcpHandler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
