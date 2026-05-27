/**
 * Ping tool - connection test for Tsukuras MCP Server
 */

export const pingToolDefinition = {
  name: "ping",
  description:
    "A test tool that returns 'pong' along with server info. " +
    "Use this to verify the MCP server is working correctly.",
  inputSchema: {
    type: "object" as const,
    properties: {
      message: {
        type: "string",
        description: "Optional message to echo back",
      },
    },
    required: [],
  },
};

export async function handlePing(args: { message?: string }): Promise<string> {
  const serverName = "tsukuras-mcp-server";
  const tsukurasUrl = "https://tsukuras.jp";

  let response = `pong! Server: ${serverName}`;

  if (args.message) {
    response += ` | Echo: ${args.message}`;
  }

  response += `\n\nThis server provides Tsukuras construction industry data.`;
  response += `\nWebsite: ${tsukurasUrl}`;
  response += `\n\n北海道の建設業データをAIエージェントに提供するMCPサーバーです。`;

  return response;
}
