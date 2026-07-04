import { WorkspaceService, WorkspaceSnapshot } from "@/lib/db/workspace-service";
import { AgentContext, AiSettingsSnapshot, WorkspaceSnapshot as AiWorkspaceSnapshot } from "./types";

function toAiSnapshot(ws: WorkspaceSnapshot): AiWorkspaceSnapshot {
  return {
    conversationId: ws.conversation.conversation_id,
    documentId: ws.document.document_id,
    messages: ws.messages.map((m) => ({
      message_id: m.message_id,
      role: m.role,
      content: m.content,
    })),
    insights: ws.insights.map((i) => ({
      insight_id: i.insight_id,
      title: i.title,
      content: i.content,
      status: i.status,
      relevance: i.relevance,
      maturity: i.maturity,
      created_at: i.created_at,
    })),
    blocks: ws.blocks.map((b) => ({
      block_id: b.block_id,
      content: b.content,
      block_type: b.block_type,
      position: b.position,
      linked_insights: b.linked_insights,
      source_messages: b.source_messages,
    })),
    graphNodes: ws.graphNodes.map((n) => ({
      node_id: n.node_id,
      node_type: n.node_type,
      entity_id: n.entity_id,
      label: n.label,
    })),
    graphEdges: ws.graphEdges.map((e) => ({
      edge_id: e.edge_id,
      source_node_id: e.source_node_id,
      target_node_id: e.target_node_id,
      relationship_type: e.relationship_type,
    })),
    documentMemories: [],
    generalizedLearnings: [],
    exemplars: ws.exemplars.map((e) => ({
      exemplar_id: e.exemplar_id,
      title: e.title,
      markdown: e.markdown,
      userNotes: e.userNotes,
    })),
  };
}

/** Build agent context from Postgres (server / MCP / API routes). */
export async function buildAgentContextFromDb(userId: string): Promise<AgentContext> {
  const service = new WorkspaceService(userId);
  const ws = await service.getWorkspace();
  const stores = toAiSnapshot(ws);

  const settings: AiSettingsSnapshot = {
    backgroundAgents: { ...ws.settings.backgroundAgents },
  };

  return {
    conversationId: stores.conversationId,
    documentId: stores.documentId,
    stores,
    settings,
  };
}
