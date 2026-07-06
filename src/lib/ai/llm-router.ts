import { AiAction } from "./actions";
import { routeAction, RoutingDecision } from "./dev-router";
import { AgentContext, AgentId } from "./types";
import { callAIForJSON } from "./call-ai";
import { resolveProviderConfig } from "./provider";

export type RoutingSource = "llm" | "rules";

export interface ResolvedRouting extends RoutingDecision {
  source: RoutingSource;
}

const VALID_AGENTS = new Set<AgentId>([
  "chat",
  "document_integration",
  "document_expansion",
  "tonal_adjustment",
  "insight_extraction",
  "suggestion",
  "knowledge_graph",
  "ranking",
  "exemplar_learning",
  "memory_management",
]);

const ROUTER_PROMPT = `You route Cerulean AI actions to specialist agents.

Return JSON: { "primary_agent": "<agent_id>", "background_agents": ["<agent_id>", ...], "confidence": "high"|"medium"|"low" }

Valid primary agents: chat, document_integration, document_expansion, tonal_adjustment, insight_extraction, suggestion, knowledge_graph, ranking, exemplar_learning, memory_management

Rules:
- chat.respond → chat
- document.promote → document_integration
- document.expand → document_expansion
- insight.propose / insight.extract → insight_extraction
- suggestion.generate → suggestion
- Only include background agents that are enabled in settings`;

function filterBackgroundAgents(
  agents: string[],
  context: AgentContext
): AgentId[] {
  const bg = context.settings.backgroundAgents;
  const allowed = new Set<AgentId>();

  for (const id of agents) {
    if (!VALID_AGENTS.has(id as AgentId)) continue;
    if (id === "suggestion" && !bg.suggestion) continue;
    if (id === "knowledge_graph" && !bg.knowledgeGraph) continue;
    if (id === "ranking" && !bg.ranking) continue;
    if (id === "tonal_adjustment" && !bg.tonalAdjustment) continue;
    allowed.add(id as AgentId);
  }
  return Array.from(allowed);
}

export async function resolveRouting(
  action: AiAction,
  context: AgentContext
): Promise<ResolvedRouting> {
  const smartRouting = context.settings.smartRouting !== false;
  const config = resolveProviderConfig(
    context.providerConfig
      ? {
          customProvider: context.providerConfig.provider,
          customModel: context.providerConfig.model,
          customApiKey: context.providerConfig.apiKey,
        }
      : undefined
  );

  const rulesDecision = routeAction(action, context);

  if (!smartRouting || config.provider === "dev") {
    return { ...rulesDecision, source: "rules" };
  }

  try {
    const bg = context.settings.backgroundAgents;
    const aiResult = await Promise.race([
      callAIForJSON<{
        primary_agent?: string;
        background_agents?: string[];
      }>({
        systemPrompt: ROUTER_PROMPT,
        userMessage: `Action type: ${action.type}\nBackground enabled: suggestion=${bg.suggestion}, knowledge_graph=${bg.knowledgeGraph}, ranking=${bg.ranking}, tonal=${bg.tonalAdjustment}`,
        fallback: {},
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 400)),
    ]);

    if (!aiResult) {
      return { ...rulesDecision, source: "rules" };
    }

    const primary = aiResult.primary_agent as AgentId | undefined;
    if (primary && VALID_AGENTS.has(primary)) {
      const backgroundAgents = filterBackgroundAgents(
        aiResult.background_agents ?? [],
        context
      );
      return {
        primaryAgent: primary,
        backgroundAgents,
        source: "llm",
      };
    }
  } catch {
    // fall through to rules
  }

  return { ...rulesDecision, source: "rules" };
}
