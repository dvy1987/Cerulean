import { PatchOperation } from "@/types";

// All possible AI actions in the system
// The orchestrator uses this to route to the correct agent(s)

export type AiAction =
  | ChatRespondAction
  | DocumentPromoteAction
  | DocumentExpandAction
  | TonalAdjustAction
  | InsightExtractAction
  | SuggestionGenerateAction
  | ContradictionDetectAction
  | RankingScoreAction
  | GraphUpdateAction
  | ExemplarLearnAction
  | MemoryManageAction
  | InsightToPromptAction;

export interface ChatRespondAction {
  type: "chat.respond";
  input: { userMessage: string };
}

export interface DocumentPromoteAction {
  type: "document.promote";
  input: {
    text: string;
    insightId: string | null;
    sourceMessageIds: string[];
  };
}

export interface DocumentExpandAction {
  type: "document.expand";
  input: {
    blockId: string;
    operation: "expand_argument" | "add_example" | "add_counterpoint" | "clarify_language";
  };
}

export interface TonalAdjustAction {
  type: "tone.adjust";
  input: {
    text: string;
    mode: "match_document" | "user_directed";
    userDirection?: string;
    exemplarText?: string;
  };
}

export interface InsightExtractAction {
  type: "insight.extract";
  input: {
    text: string;
    source: "document_import" | "exemplar_upload";
  };
}

export interface SuggestionGenerateAction {
  type: "suggestion.generate";
  input: Record<string, never>;  // uses context only
}

export interface ContradictionDetectAction {
  type: "insight.detect_contradictions";
  input: Record<string, never>;  // uses context only
}

export interface RankingScoreAction {
  type: "ranking.score";
  input: Record<string, never>;  // uses context only
}

export interface GraphUpdateAction {
  type: "graph.update";
  input: {
    trigger: "message_added" | "insight_added" | "patch_accepted" | "insight_promoted";
    entityId?: string;
    entityType?: "message" | "insight" | "document_block";
  };
}

export interface ExemplarLearnAction {
  type: "exemplar.learn";
  input: {
    exemplarId: string;
  };
}

export interface MemoryManageAction {
  type: "memory.manage";
  input: {
    trigger: "message_complete" | "insight_added" | "patch_accepted" | "session_end";
  };
}

export interface InsightToPromptAction {
  type: "insight.to_prompt";
  input: {
    insightTitle: string;
    insightContent: string;
  };
}

// Action result types
export interface ChatRespondResult {
  response: string;
}

export interface DocumentPromoteResult {
  operations: PatchOperation[];
}

export interface DocumentExpandResult {
  operations: PatchOperation[];
}

export interface TonalAdjustResult {
  adjustedText: string;
}

export interface InsightExtractResult {
  insights: Array<{ title: string; content: string }>;
}

export interface SuggestionResult {
  suggestions: Array<{
    text: string;
    source: "unresolved_insight" | "document_gap" | "contradiction" | "context";
    source_entity_id?: string;
  }>;
}

export interface ContradictionResult {
  contradictions: Array<{
    insight_a_id: string;
    insight_b_id: string;
    description: string;
  }>;
}

export interface RankingResult {
  scores: Record<string, { relevance: number; maturity: number }>;
}

export interface GraphUpdateResult {
  nodesAdded: number;
  edgesAdded: number;
}

export interface ExemplarLearnResult {
  learnings: Array<{ title: string; content: string; targetAgents: string[] }>;
}

export interface MemoryManageResult {
  memoriesCompacted: number;
  learningsPromoted: number;
}

export interface InsightToPromptResult {
  prompt: string;
}
