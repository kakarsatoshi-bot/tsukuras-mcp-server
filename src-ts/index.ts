/**
 * Tsukuras MCP Server
 * Cloudflare Workers + MCP SDK (TypeScript)
 *
 * Session 3-A: Initial TypeScript implementation with ping tool only.
 * Features (company search, area stats, work categories)
 * will be added in later sessions.
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { handlePing } from "./tools/ping";

export interface Env {
  TsukurasMcpAgent: DurableObjectNamespace;
}

export class TsukurasMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: "tsukuras-mcp-server",
    version: "0.1.0",
  });

  async init() {
    this.server.registerTool(
      "ping",
      {
        description:
          "A test tool that returns 'pong' along with server info. " +
          "Use this to verify the MCP server is working correctly.",
        inputSchema: { message: z.string().optional() },
      },
      async ({ message }) => {
        const result = await handlePing({ message });
        return { content: [{ type: "text", text: result }] };
      }
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
          version: "0.1.0",
          website: "https://tsukuras.jp",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          name: "Tsukuras MCP Server",
          description:
            "MCP server providing Hokkaido construction industry data",
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
