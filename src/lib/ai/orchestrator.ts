import { AiAction } from "./actions";
import { AgentResult } from "./types";
import { agentRegistry } from "./registry";
import { buildAgentContext } from "./context";
import { routeAction } from "./dev-router";
import { scheduleBackgroundAgents } from "./background";

export interface OrchestratorOptions {
  onChunk?: (chunk: string) => void;
}

/**
 * Main entry point for all AI actions in Cerulean.
 * The orchestrator:
 * 1. Builds a context snapshot from current state
 * 2. Routes the action to the correct agent(s) via LLM-based routing (dev mode: rule-based)
 * 3. Executes the primary agent
 * 4. Schedules background agents if enabled
 * 5. Returns the result
 */
export async function runAiAction<T = unknown>(
  action: AiAction,
  options?: OrchestratorOptions
): Promise<AgentResult<T>> {
  const context = buildAgentContext();

  // Route action to primary agent (in dev mode, uses rule-based routing)
  const routing = routeAction(action, context);

  // Get the primary agent
  const primaryAgent = agentRegistry.get(routing.primaryAgent);
  if (!primaryAgent) {
    return {
      agentId: routing.primaryAgent,
      success: false,
      data: null as T,
      error: `Agent "${routing.primaryAgent}" not found in registry`,
    };
  }

  // Execute primary agent
  const result = await primaryAgent.run(action.input, context, {
    onChunk: options?.onChunk,
  });

  // Schedule background agents (non-blocking)
  if (routing.backgroundAgents.length > 0) {
    scheduleBackgroundAgents(routing.backgroundAgents, action, context);
  }

  return result as AgentResult<T>;
}
