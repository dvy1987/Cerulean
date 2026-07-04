import type { CeruleanClient } from "./client.js";
import { toUserFriendlyError } from "./errors.js";
import { failure, success, type ToolResult } from "./responses.js";

/**
 * Wraps every tool so errors become clear messages for the IDE AI
 * instead of crashing the MCP server.
 */
export async function safeTool<T>(
  summary: string,
  fn: () => Promise<T>
): Promise<ToolResult> {
  try {
    const data = await fn();
    return success(data, summary);
  } catch (err) {
    return failure(toUserFriendlyError(err), err instanceof Error ? { name: err.name } : err);
  }
}

/** Find an insight by partial title or content match (case-insensitive) */
export async function findInsightByQuery(
  client: CeruleanClient,
  query: string
): Promise<{ insight: Record<string, unknown> | null; matches: Record<string, unknown>[] }> {
  const { insights } = await client.listInsights();
  const q = query.toLowerCase().trim();
  const matches = (insights as Record<string, unknown>[]).filter((i) => {
    const title = String(i.title ?? "").toLowerCase();
    const content = String(i.content ?? "").toLowerCase();
    return title.includes(q) || content.includes(q);
  });
  return {
    insight: matches[0] ?? null,
    matches,
  };
}

export const SERVER_INSTRUCTIONS = `
You are connected to Cerulean — a thinking workspace (chat → insights → document).

RULES:
1. Call cerulean_verify_connection at the start of a Cerulean-related task.
2. Call cerulean_get_workspace to see current state before making changes.
3. When the user likes an idea → cerulean_add_insight.
4. When they say "promote this" → cerulean_promote_insight, cerulean_promote_text, or cerulean_promote_by_search.
5. NEVER auto-accept patches unless the user explicitly asks. Default: create patch → show summary → wait.
6. Save chat turns with cerulean_save_chat_turn so the web app stays in sync.
7. You (the IDE AI) do the thinking; Cerulean stores the structure.

Only this user's data is accessible via this connection.
`.trim();
