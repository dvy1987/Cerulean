import { AiAction } from "./actions";
import { AgentResult, AgentContext } from "./types";
import { agentRegistry } from "./registry";
import { buildAgentContext } from "./context";
import { buildAgentContextFromDb } from "./context-from-db";
import { routeThroughRuntime } from "./runtime-router";

export interface OrchestratorOptions {
  onChunk?: (chunk: string) => void;
  /** When set, loads workspace from database (required for API/MCP server calls). */
  userId?: string;
  /** Pre-built context (optional override). */
  context?: AgentContext;
  /** Override provider for this action (server stream / user keys). */
  providerConfig?: import("./provider").ProviderConfig;
}

/**
 * Main entry point for all AI actions in Cerulean.
 */
export async function runAiAction<T = unknown>(
  action: AiAction,
  options?: OrchestratorOptions
): Promise<AgentResult<T>> {
  const context =
    options?.context ??
    (options?.userId
      ? await buildAgentContextFromDb(options.userId)
      : buildAgentContext());

  if (options?.providerConfig) {
    context.providerConfig = options.providerConfig;
  }

  const routing = routeThroughRuntime(action, context);

  const primaryAgent = agentRegistry.get(routing.primaryAgent);
  if (!primaryAgent) {
    return {
      agentId: routing.primaryAgent,
      success: false,
      data: null as T,
      error: `Agent "${routing.primaryAgent}" not found in registry`,
    };
  }

  const result = await primaryAgent.run(action.input, context, {
    onChunk: options?.onChunk,
  });

  // Background agents for chat are handled by post-chat-pipeline after stream ends.
  if (routing.backgroundAgents.length > 0 && action.type !== "chat.respond") {
    const { scheduleBackgroundAgents } = await import("./background");
    scheduleBackgroundAgents(routing.backgroundAgents, action, context, options?.userId);
  }

  return result as AgentResult<T>;
}
