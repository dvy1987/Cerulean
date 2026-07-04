import type { CeruleanClient } from "./client.js";
import { type ToolResult } from "./responses.js";
/**
 * Wraps every tool so errors become clear messages for the IDE AI
 * instead of crashing the MCP server.
 */
export declare function safeTool<T>(summary: string, fn: () => Promise<T>): Promise<ToolResult>;
/** Find an insight by partial title or content match (case-insensitive) */
export declare function findInsightByQuery(client: CeruleanClient, query: string): Promise<{
    insight: Record<string, unknown> | null;
    matches: Record<string, unknown>[];
}>;
export declare const SERVER_INSTRUCTIONS: string;
