// Core data models for Cerulean
// These types are the source of truth for all modules.

export type MessageRole = "user" | "assistant";

export interface Message {
  message_id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export type InsightStatus =
  | "captured"
  | "discussing"
  | "resolved"
  | "promoted"
  | "archived";

export interface Insight {
  insight_id: string;
  title: string;
  summary: string;
  content: string;
  status: InsightStatus;
  priority: number;
  conversation_id: string | null;
  source_message_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type BlockType = "heading" | "paragraph" | "bullet" | "section";

export interface DocumentBlock {
  block_id: string;
  document_id: string;
  content: string;
  block_type: BlockType;
  position: number;
  linked_insights: string[];
  source_messages: string[];
  created_at: string;
  updated_at: string;
}

export type PatchOperationType =
  | "insert_block"
  | "update_block"
  | "delete_block"
  | "move_block";

export interface PatchOperation {
  type: PatchOperationType;
  block_id: string;
  block?: Partial<DocumentBlock>;
  position?: number;
}

export type PatchStatus = "pending" | "accepted" | "reverted";

export interface Patch {
  patch_id: string;
  document_id: string;
  operations: PatchOperation[];
  status: PatchStatus;
  source_insight_id: string | null;
  source_text: string | null;
  created_at: string;
}

export interface Conversation {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}
