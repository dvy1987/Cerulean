import { AiAction } from "./actions";
import { AgentContext, AgentId } from "./types";

export interface RoutingDecision {
  primaryAgent: AgentId;
  backgroundAgents: AgentId[];
}

/**
 * Dev-mode router: rule-based action-to-agent mapping.
 * In production, this will be replaced by an LLM-based router.
 */
export function routeAction(action: AiAction, context: AgentContext): RoutingDecision {
  const bg = context.settings.backgroundAgents;

  switch (action.type) {
    case "chat.respond":
      return {
        primaryAgent: "chat",
        backgroundAgents: [
          ...(bg.suggestion ? ["suggestion" as AgentId] : []),
          ...(bg.knowledgeGraph ? ["knowledge_graph" as AgentId] : []),
        ],
      };

    case "document.promote":
      return {
        primaryAgent: "document_integration",
        backgroundAgents: [
          ...(bg.tonalAdjustment ? ["tonal_adjustment" as AgentId] : []),
          ...(bg.ranking ? ["ranking" as AgentId] : []),
          ...(bg.knowledgeGraph ? ["knowledge_graph" as AgentId] : []),
        ],
      };

    case "document.expand":
      return {
        primaryAgent: "document_expansion",
        backgroundAgents: [
          ...(bg.knowledgeGraph ? ["knowledge_graph" as AgentId] : []),
        ],
      };

    case "tone.adjust":
      return {
        primaryAgent: "tonal_adjustment",
        backgroundAgents: [],
      };

    case "insight.extract":
      return {
        primaryAgent: "insight_extraction",
        backgroundAgents: [
          ...(bg.ranking ? ["ranking" as AgentId] : []),
          ...(bg.knowledgeGraph ? ["knowledge_graph" as AgentId] : []),
        ],
      };

    case "suggestion.generate":
      return {
        primaryAgent: "suggestion",
        backgroundAgents: [],
      };

    case "insight.detect_contradictions":
      return {
        primaryAgent: "knowledge_graph",
        backgroundAgents: [],
      };

    case "ranking.score":
      return {
        primaryAgent: "ranking",
        backgroundAgents: [],
      };

    case "graph.update":
      return {
        primaryAgent: "knowledge_graph",
        backgroundAgents: [],
      };

    case "exemplar.learn":
      return {
        primaryAgent: "exemplar_learning",
        backgroundAgents: ["memory_management"],
      };

    case "memory.manage":
      return {
        primaryAgent: "memory_management",
        backgroundAgents: [],
      };

    case "insight.to_prompt":
      return {
        primaryAgent: "chat",
        backgroundAgents: [],
      };

    default:
      return {
        primaryAgent: "chat",
        backgroundAgents: [],
      };
  }
}
