// Agent type definitions for the multi-agent architecture

export type AgentId =
  | "orchestrator"
  | "chat"
  | "document_integration"
  | "document_expansion"
  | "tonal_adjustment"
  | "insight_extraction"
  | "suggestion"
  | "knowledge_graph"
  | "ranking"
  | "exemplar_learning"
  | "memory_management";

export interface WorkspaceSnapshot {
  conversationId: string;
  documentId: string;
  messages: Array<{ message_id: string; role: string; content: string }>;
  insights: Array<{ insight_id: string; title: string; content: string; status: string; relevance: number; maturity: number; created_at: string }>;
  blocks: Array<{ block_id: string; content: string; block_type: string; position: number; linked_insights: string[]; source_messages: string[] }>;
  graphNodes: Array<{ node_id: string; node_type: string; entity_id: string; label: string }>;
  graphEdges: Array<{ edge_id: string; source_node_id: string; target_node_id: string; relationship_type: string }>;
  documentMemories: Array<{ memory_id: string; title: string; markdown: string }>;
  generalizedLearnings: Array<{ learning_id: string; title: string; markdown: string }>;
  exemplars: Array<{ exemplar_id: string; title: string; markdown: string; userNotes: string }>;
}

export interface AiSettingsSnapshot {
  backgroundAgents: {
    knowledgeGraph: boolean;
    ranking: boolean;
    suggestion: boolean;
    tonalAdjustment: boolean;
  };
}

export interface AgentContext {
  conversationId: string;
  documentId: string;
  stores: WorkspaceSnapshot;
  settings: AiSettingsSnapshot;
}

export interface AgentResult<T = unknown> {
  agentId: AgentId;
  success: boolean;
  data: T;
  error?: string;
}

export interface AgentDefinition<TInput = unknown, TOutput = unknown> {
  id: AgentId;
  name: string;
  description: string;
  systemPrompt: string;
  run: (
    input: TInput,
    context: AgentContext,
    options?: { onChunk?: (chunk: string) => void }
  ) => Promise<AgentResult<TOutput>>;
}
