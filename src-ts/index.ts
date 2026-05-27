/**
 * Tsukuras MCP Server v0.6.0
 * Added annotations and improved parameter descriptions for Smithery quality score
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

import { pingToolDefinition, handlePing } from "./tools/ping";
import { searchCompaniesToolDefinition, handleSearchCompanies } from "./tools/search_companies";
import { getAreaStatsToolDefinition, handleGetAreaStats } from "./tools/get_area_stats";
import { getWorkCategoryToolDefinition, handleGetWorkCategory } from "./tools/get_work_category";
import { listWorkCategoriesToolDefinition, handleListWorkCategories } from "./tools/list_work_categories";
import { withLogging } from "./utils/logger";

export interface Env {
  TsukurasMcpAgent: DurableObjectNamespace;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export class TsukurasMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: "tsukuras-mcp-server",
    version: "0.6.0",
  });

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
        inputSchema: {
          message: z.string().optional().describe("Optional message to echo back"),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ message }) => ({
        content: [
          {
            type: "text",
            text: await withLogging("ping", { message }, () => handlePing({ message })),
          },
        ],
      })
    );

    // search_companies
    this.server.registerTool(
      searchCompaniesToolDefinition.name,
      {
        description: searchCompaniesToolDefinition.description,
        inputSchema: {
          area: z.string().optional().describe("市町村名（例：旭川市、札幌市、帯広市）。部分一致で検索します。"),
          work_category: z.string().optional().describe("工事カテゴリのslug（例：paving=舗装工事、general-civil=土木一般）。"),
          limit: z.number().optional().describe("返す件数の上限（デフォルト10、最大50）"),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ area, work_category, limit }) => ({
        content: [
          {
            type: "text",
            text: await withLogging(
              "search_companies",
              { area, work_category, limit },
              () => handleSearchCompanies({ area, work_category, limit }, supabase)
            ),
          },
        ],
      })
    );

    // get_area_stats
    this.server.registerTool(
      getAreaStatsToolDefinition.name,
      {
        description: getAreaStatsToolDefinition.description,
        inputSchema: {
          area: z.string().describe("市町村名（例：旭川市、札幌市、帯広市）"),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ area }) => ({
        content: [
          {
            type: "text",
            text: await withLogging(
              "get_area_stats",
              { area },
              () => handleGetAreaStats({ area }, supabase)
            ),
          },
        ],
      })
    );

    // get_work_category
    this.server.registerTool(
      getWorkCategoryToolDefinition.name,
      {
        description: getWorkCategoryToolDefinition.description,
        inputSchema: {
          work_category: z.string().describe("工事カテゴリのslugまたは日本語名（例：paving / 舗装工事、general-civil / 土木一般）"),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ work_category }) => ({
        content: [
          {
            type: "text",
            text: await withLogging(
              "get_work_category",
              { work_category },
              () => handleGetWorkCategory({ work_category }, supabase)
            ),
          },
        ],
      })
    );

    // list_work_categories
    this.server.registerTool(
      listWorkCategoriesToolDefinition.name,
      {
        description: listWorkCategoriesToolDefinition.description,
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => ({
        content: [
          {
            type: "text",
            text: await withLogging(
              "list_work_categories",
              {},
              () => handleListWorkCategories(supabase)
            ),
          },
        ],
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
          version: "0.6.0",
          tools: ["ping", "search_companies", "get_area_stats", "get_work_category", "list_work_categories"],
          website: "https://tsukuras.jp",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          name: "Tsukuras MCP Server",
          version: "0.6.0",
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
