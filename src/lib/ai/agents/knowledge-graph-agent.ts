import { AgentDefinition, AgentContext, AgentResult } from "../types";
import {
  GraphUpdateAction,
  GraphUpdateResult,
  ContradictionResult,
} from "../actions";
import { agentRegistry } from "../registry";
import { detectContradictions } from "../dev-ai";


type KnowledgeGraphInput =
  | GraphUpdateAction["input"]
  | Record<string, never>;

type KnowledgeGraphOutput = GraphUpdateResult | ContradictionResult;

const knowledgeGraphAgent: AgentDefinition<KnowledgeGraphInput, KnowledgeGraphOutput> = {
  id: "knowledge_graph",
  name: "Knowledge Graph Agent",
  description:
    "Creates and maintains the full knowledge graph — nodes, edges, relationship types. Handles contradiction detection as part of relationship analysis.",
  systemPrompt: `You are the Knowledge Graph Agent. You maintain a knowledge graph of all entities 
(messages, insights, document blocks, topics) and their relationships (supports, contradicts, 
expands, references, derived_from). When triggered, analyze the workspace state and create or 
update graph nodes and edges. Contradiction detection is a byproduct of your relationship 
analysis — when two entities contradict each other, flag them.`,

  async run(
    input: KnowledgeGraphInput,
    context: AgentContext
  ): Promise<AgentResult<KnowledgeGraphOutput>> {
    // Determine which action we're handling based on input shape
    const isGraphUpdate = "trigger" in input;

    if (isGraphUpdate) {
      return handleGraphUpdate(input as GraphUpdateAction["input"], context);
    }
    return handleContradictionDetection(context);
  },
};

function handleGraphUpdate(
  input: GraphUpdateAction["input"],
  context: AgentContext
): AgentResult<GraphUpdateResult> {
  const { messages, insights, blocks, graphNodes } = context.stores;

  // Build a set of entity IDs that already have nodes
  const existingEntityIds = new Set(graphNodes.map((n) => n.entity_id));

  let nodesAdded = 0;
  let edgesAdded = 0;

  // In dev mode, simulate graph updates by checking for entities without nodes
  // When a specific entity triggered the update, prioritize it
  const entitiesToProcess: Array<{ entityId: string; entityType: string; label: string }> = [];

  if (input.entityId && input.entityType && !existingEntityIds.has(input.entityId)) {
    // Add the specific entity that triggered the update
    let label = input.entityId;
    if (input.entityType === "message") {
      const msg = messages.find((m) => m.message_id === input.entityId);
      if (msg) label = msg.content.slice(0, 50);
    } else if (input.entityType === "insight") {
      const ins = insights.find((i) => i.insight_id === input.entityId);
      if (ins) label = ins.title;
    } else if (input.entityType === "document_block") {
      const blk = blocks.find((b) => b.block_id === input.entityId);
      if (blk) label = blk.content.slice(0, 50);
    }
    entitiesToProcess.push({
      entityId: input.entityId,
      entityType: input.entityType,
      label,
    });
  }

  // Also scan for any entities missing nodes (dev mode catch-up)
  for (const insight of insights) {
    if (!existingEntityIds.has(insight.insight_id)) {
      entitiesToProcess.push({
        entityId: insight.insight_id,
        entityType: "insight",
        label: insight.title,
      });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  for (const entity of entitiesToProcess) {
    if (seen.has(entity.entityId)) continue;
    seen.add(entity.entityId);
    // In dev mode we count nodes that would be created
    nodesAdded++;
  }

  // Simulate edge creation: connect new insight nodes to recent message nodes
  if (input.trigger === "insight_added" || input.trigger === "insight_promoted") {
    // Each new insight gets one "derived_from" edge to the most recent message node
    const messageNodes = graphNodes.filter((n) => n.node_type === "message");
    if (messageNodes.length > 0) {
      edgesAdded += Math.min(nodesAdded, 1);
    }
  }

  // For message_added, link to existing topic nodes if any
  if (input.trigger === "message_added") {
    const topicNodes = graphNodes.filter((n) => n.node_type === "topic");
    if (topicNodes.length > 0) {
      edgesAdded += 1;
    }
  }

  return {
    agentId: "knowledge_graph",
    success: true,
    data: { nodesAdded, edgesAdded },
  };
}

function handleContradictionDetection(
  context: AgentContext
): AgentResult<ContradictionResult> {
  const { insights } = context.stores;

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
