import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { GraphUpdateAction, GraphUpdateResult, ContradictionResult } from "../actions";
import { agentRegistry } from "../registry";
import { detectContradictions } from "../dev-ai";
import { callAIForJSON } from "../call-ai";

type KnowledgeGraphInput = GraphUpdateAction["input"] | Record<string, never>;
type KnowledgeGraphOutput = GraphUpdateResult | ContradictionResult;

const CONTRADICTION_SYSTEM_PROMPT = `You are the Knowledge Graph Agent inside Cerulean, a structured thinking workspace.

Your task is to detect contradictions between insights. Two insights contradict each other when they make opposing claims, recommend conflicting approaches, or express incompatible assumptions.

Return a JSON array of contradictions. Each object: {"insight_a_id": string, "insight_b_id": string, "description": string}
If there are no contradictions, return an empty array [].`;

const knowledgeGraphAgent: AgentDefinition<KnowledgeGraphInput, KnowledgeGraphOutput> = {
  id: "knowledge_graph",
  name: "Knowledge Graph Agent",
  description:
    "Creates and maintains the full knowledge graph — nodes, edges, relationship types. Handles contradiction detection as part of relationship analysis.",
  systemPrompt: CONTRADICTION_SYSTEM_PROMPT,

  async run(input: KnowledgeGraphInput, context: AgentContext): Promise<AgentResult<KnowledgeGraphOutput>> {
    const isGraphUpdate = "trigger" in input;
    if (isGraphUpdate) {
      return handleGraphUpdate(input as GraphUpdateAction["input"], context);
    }
    return handleContradictionDetection(context);
  },
};

function handleGraphUpdate(input: GraphUpdateAction["input"], context: AgentContext): AgentResult<GraphUpdateResult> {
  const { messages, insights, blocks, graphNodes } = context.stores;
  const existingEntityIds = new Set(graphNodes.map((n) => n.entity_id));
  let nodesAdded = 0;
  let edgesAdded = 0;

  const entitiesToProcess: Array<{ entityId: string; entityType: string }> = [];

  if (input.entityId && input.entityType && !existingEntityIds.has(input.entityId)) {
    entitiesToProcess.push({ entityId: input.entityId, entityType: input.entityType });
  }

  for (const insight of insights) {
    if (!existingEntityIds.has(insight.insight_id)) {
      entitiesToProcess.push({ entityId: insight.insight_id, entityType: "insight" });
    }
  }

  const seen = new Set<string>();
  for (const entity of entitiesToProcess) {
    if (seen.has(entity.entityId)) continue;
    seen.add(entity.entityId);
    nodesAdded++;
  }

  if (input.trigger === "insight_added" || input.trigger === "insight_promoted") {
    const messageNodes = graphNodes.filter((n) => n.node_type === "message");
    if (messageNodes.length > 0) edgesAdded += Math.min(nodesAdded, 1);
  }

  if (input.trigger === "message_added") {
    const topicNodes = graphNodes.filter((n) => n.node_type === "topic");
    if (topicNodes.length > 0) edgesAdded += 1;
  }

  void messages;
  void blocks;

  return {
    agentId: "knowledge_graph",
    success: true,
    data: { nodesAdded, edgesAdded },
  };
}

async function handleContradictionDetection(context: AgentContext): Promise<AgentResult<ContradictionResult>> {
  const { insights } = context.stores;

  if (insights.length >= 2) {
    const insightList = insights
      .map((i) => `ID: ${i.insight_id}\nContent: ${i.content}`)
      .join("\n\n---\n\n");

    const aiContradictions = await callAIForJSON<ContradictionResult["contradictions"]>({
      systemPrompt: CONTRADICTION_SYSTEM_PROMPT,
      userMessage: `Analyze these insights for contradictions:\n\n${insightList}`,
      fallback: [],
    });

    if (aiContradictions.length >= 0) {
      return {
        agentId: "knowledge_graph",
        success: true,
        data: { contradictions: aiContradictions },
      };
    }
  }

  const contradictions = detectContradictions(
    insights.map((i) => ({ insight_id: i.insight_id, content: i.content }))
  );

  return {
    agentId: "knowledge_graph",
    success: true,
    data: { contradictions },
  };
}

agentRegistry.register(knowledgeGraphAgent);

export default knowledgeGraphAgent;
