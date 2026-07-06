import { AiAction } from "./actions";
import { AgentContext, AgentId } from "./types";
import { routeAction, RoutingDecision } from "./dev-router";
import { isRuntimeRequestBody, runtimeRequestToAction } from "./runtime-request";

export type { RuntimeRequest, RuntimeRoute } from "./runtime-request";
export {
  isRuntimeRequestBody,
  runtimeRequestToAction,
  actionToRuntimeRoute,
} from "./runtime-request";

export type RuntimeConcern = "conversation" | "document" | "graph" | "meta";

const ACTION_RUNTIME: Record<AiAction["type"], RuntimeConcern> = {
  "chat.respond": "conversation",
  "insight.propose": "conversation",
  "insight.to_prompt": "conversation",
  "suggestion.generate": "conversation",
  "document.promote": "document",
  "document.expand": "document",
  "tone.adjust": "document",
  "insight.extract": "conversation",
  "insight.detect_contradictions": "graph",
  "ranking.score": "graph",
  "graph.update": "graph",
  "exemplar.learn": "meta",
  "memory.manage": "meta",
};

export function getRuntimeConcern(action: AiAction): RuntimeConcern {
  return ACTION_RUNTIME[action.type] ?? "conversation";
}

/** Route legacy AiAction to agents via dev-router (MVP rule-based routing). */
export function routeThroughRuntime(
  action: AiAction,
  context: AgentContext
): RoutingDecision {
  return routeAction(action, context);
}

/** Resolve POST /api/v1/ai/run body — legacy `action` or spec `runtime` envelope. */
export function resolveAiRunAction(body: unknown): AiAction {
  if (isRuntimeRequestBody(body)) {
    return runtimeRequestToAction(body.runtime);
  }
  const { action } = body as { action?: AiAction };
  if (!action?.type) {
    throw new Error("action or runtime is required");
  }
  return action;
}

export function getRuntimeAgentGroup(agentId: AgentId): RuntimeConcern {
  const map: Partial<Record<AgentId, RuntimeConcern>> = {
    chat: "conversation",
    insight_extraction: "conversation",
    suggestion: "conversation",
    document_integration: "document",
    document_expansion: "document",
    tonal_adjustment: "document",
    knowledge_graph: "graph",
    ranking: "graph",
    exemplar_learning: "meta",
    memory_management: "meta",
  };
  return map[agentId] ?? "conversation";
}
