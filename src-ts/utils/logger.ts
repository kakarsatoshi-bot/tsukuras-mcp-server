/**
 * Query Logger for Tsukuras MCP Server
 * Uses Cloudflare Workers Logs (console.log) for zero-cost logging
 */

export interface QueryLog {
  tool_name: string;
  params: Record<string, unknown>;
  status: "success" | "error";
  latency_ms: number;
  error_code?: string;
}

export function logQuery(log: QueryLog): void {
  console.log(
    JSON.stringify({
      type: "mcp_query",
      timestamp: new Date().toISOString(),
      tool_name: log.tool_name,
      params: log.params,
      status: log.status,
      latency_ms: log.latency_ms,
      error_code: log.error_code ?? null,
    })
  );
}

export async function withLogging<T>(
  toolName: string,
  params: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logQuery({
      tool_name: toolName,
      params,
      status: "success",
      latency_ms: Date.now() - start,
    });
    return result;
  } catch (err) {
    logQuery({
      tool_name: toolName,
      params,
      status: "error",
      latency_ms: Date.now() - start,
      error_code: String(err),
    });
    throw err;
  }
}
