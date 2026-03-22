import { useChatStore } from "@/store/chatStore";
import { useDocumentStore } from "@/store/documentStore";
import { useInsightStore } from "@/store/insightStore";
import { useGraphStore } from "@/store/graphStore";
import { useMemoryStore } from "@/store/memoryStore";
import { useAiSettingsStore } from "@/store/aiSettingsStore";
import { AgentContext, WorkspaceSnapshot, AiSettingsSnapshot } from "./types";

/**
 * Build a snapshot of all workspace state for agent context.
 * Agents receive this snapshot — they never access stores directly.
 */
export function buildAgentContext(): AgentContext {
  const chatState = useChatStore.getState();
  const docState = useDocumentStore.getState();
  const insightState = useInsightStore.getState();
  const graphState = useGraphStore.getState();
  const memoryState = useMemoryStore.getState();
  const settingsState = useAiSettingsStore.getState();

  const stores: WorkspaceSnapshot = {
    conversationId: chatState.conversation.conversation_id,
    documentId: docState.document.document_id,
    messages: chatState.messages.map((m) => ({
      message_id: m.message_id,
      role: m.role,
      content: m.content,
    })),
    insights: insightState.insights.map((i) => ({
      insight_id: i.insight_id,
      title: i.title,
      content: i.content,
      status: i.status,
      created_at: i.created_at,
    })),
    blocks: docState.blocks.map((b) => ({
      block_id: b.block_id,
      content: b.content,
      block_type: b.block_type,
      position: b.position,
      linked_insights: b.linked_insights,
      source_messages: b.source_messages,
    })),
    graphNodes: graphState.nodes.map((n) => ({
      node_id: n.node_id,
      node_type: n.node_type,
      entity_id: n.entity_id,
      label: n.label,
    })),
    graphEdges: graphState.edges.map((e) => ({
      edge_id: e.edge_id,
      source_node_id: e.source_node_id,
      target_node_id: e.target_node_id,
      relationship_type: e.relationship_type,
    })),
    documentMemories: memoryState.getDocumentMemories(docState.document.document_id).map((m) => ({
      memory_id: m.memory_id,
      title: m.title,
      markdown: m.markdown,
    })),
    generalizedLearnings: memoryState.generalizedLearnings.map((l) => ({
      learning_id: l.learning_id,
      title: l.title,
      markdown: l.markdown,
    })),
    exemplars: memoryState.exemplars.map((e) => ({
      exemplar_id: e.exemplar_id,
      title: e.title,
      markdown: e.markdown,
      userNotes: e.userNotes,
    })),
  };

  const settings: AiSettingsSnapshot = {
    backgroundAgents: { ...settingsState.backgroundAgents },
  };

  return {
    conversationId: stores.conversationId,
    documentId: stores.documentId,
    stores,
    settings,
  };
}
