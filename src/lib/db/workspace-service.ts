import {
  BlockType,
  Conversation,
  Document,
  DocumentBlock,
  GraphEdge,
  GraphEdgeRelationship,
  GraphNode,
  GraphNodeType,
  Insight,
  InsightStatus,
  Message,
  Patch,
  PatchOperation,
} from "@/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAiAction } from "@/lib/ai/orchestrator";
import { DocumentPromoteResult } from "@/lib/ai/actions";
import {
  changeDocumentTemplate,
  DEFAULT_DOCUMENT_TYPE,
  getDefaultTitle,
  seedBlocks,
  exportByTemplate,
} from "@/lib/document-templates";
import type { DocumentType } from "@/types";
export interface WorkspaceSnapshot {
  conversation: Conversation;
  document: Document;
  messages: Message[];
  blocks: DocumentBlock[];
  insights: Insight[];
  pendingPatch: Patch | null;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  settings: {
    backgroundAgents: {
      knowledgeGraph: boolean;
      ranking: boolean;
      suggestion: boolean;
      tonalAdjustment: boolean;
    };
    suggestInsights: boolean;
    advancedMode: boolean;
    hasChosenTemplate: boolean;
    customProvider: string;
    customModel: string;
  };
  exemplars: Array<{
    exemplar_id: string;
    title: string;
    markdown: string;
    userNotes: string;
    tags: string[];
    created_at: string;
  }>;
}

function mapMessage(row: Record<string, unknown>): Message {
  return {
    message_id: row.id as string,
    conversation_id: row.conversation_id as string,
    role: row.role as Message["role"],
    content: row.content as string,
    timestamp: row.created_at as string,
  };
}

function mapInsight(row: Record<string, unknown>): Insight {
  return {
    insight_id: row.id as string,
    title: row.title as string,
    summary: row.summary as string,
    content: row.content as string,
    status: row.status as InsightStatus,
    priority: row.priority as number,
    relevance: row.relevance as number,
    maturity: row.maturity as number,
    conversation_id: (row.conversation_id as string) ?? null,
    source_message_ids: (row.source_message_ids as string[]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapBlock(row: Record<string, unknown>): DocumentBlock {
  return {
    block_id: row.id as string,
    document_id: row.document_id as string,
    content: row.content as string,
    block_type: row.block_type as BlockType,
    position: row.position as number,
    linked_insights: (row.linked_insights as string[]) ?? [],
    source_messages: (row.source_messages as string[]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapPatch(row: Record<string, unknown>): Patch {
  return {
    patch_id: row.id as string,
    document_id: row.document_id as string,
    operations: row.operations as PatchOperation[],
    status: row.status as Patch["status"],
    source_insight_id: (row.source_insight_id as string) ?? null,
    source_text: (row.source_text as string) ?? null,
    placement_label: (row.placement_label as string) ?? null,
    placement_block_id: (row.placement_block_id as string) ?? null,
    created_at: row.created_at as string,
  };
}

function mapGraphNode(row: Record<string, unknown>): GraphNode {
  return {
    node_id: row.id as string,
    node_type: row.node_type as GraphNodeType,
    entity_id: row.entity_id as string,
    label: row.label as string,
    created_at: row.created_at as string,
  };
}

function mapGraphEdge(row: Record<string, unknown>): GraphEdge {
  return {
    edge_id: row.id as string,
    source_node_id: row.source_node_id as string,
    target_node_id: row.target_node_id as string,
    relationship_type: row.relationship_type as GraphEdgeRelationship,
    created_at: row.created_at as string,
  };
}

export class WorkspaceService {
  constructor(private userId: string) {}

  private db() {
    return createAdminClient();
  }

  async getWorkspaceIds(): Promise<{ conversationId: string; documentId: string }> {
    const { data, error } = await this.db()
      .from("workspace_roots")
      .select("conversation_id, document_id")
      .eq("user_id", this.userId)
      .single();

    if (error || !data) throw new Error("Workspace not found for user");
    return {
      conversationId: data.conversation_id,
      documentId: data.document_id,
    };
  }

  async getWorkspace(): Promise<WorkspaceSnapshot> {
    const { conversationId, documentId } = await this.getWorkspaceIds();
    const db = this.db();

    const [
      convRes,
      docRes,
      msgRes,
      blockRes,
      insightRes,
      patchRes,
      nodeRes,
      edgeRes,
      settingsRes,
      exemplarRes,
    ] = await Promise.all([
      db.from("conversations").select("*").eq("id", conversationId).single(),
      db.from("documents").select("*").eq("id", documentId).single(),
      db
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(500),
      db
        .from("document_blocks")
        .select("*")
        .eq("document_id", documentId)
        .order("position", { ascending: true }),
      db
        .from("insights")
        .select("*")
        .eq("user_id", this.userId)
        .order("created_at", { ascending: true }),
      db
        .from("patches")
        .select("*")
        .eq("user_id", this.userId)
        .eq("document_id", documentId)
        .eq("is_active", true)
        .eq("status", "pending")
        .maybeSingle(),
      db.from("graph_nodes").select("*").eq("user_id", this.userId),
      db.from("graph_edges").select("*").eq("user_id", this.userId),
      db.from("user_settings").select("*").eq("user_id", this.userId).single(),
      db
        .from("exemplars")
        .select("*")
        .eq("user_id", this.userId)
        .order("created_at", { ascending: false }),
    ]);

    if (convRes.error || !convRes.data) throw new Error("Conversation not found");
    if (docRes.error || !docRes.data) throw new Error("Document not found");

    const conversation: Conversation = {
      conversation_id: convRes.data.id,
      title: convRes.data.title,
      created_at: convRes.data.created_at,
      updated_at: convRes.data.updated_at,
    };

    const document: Document = {
      document_id: docRes.data.id,
      title: docRes.data.title,
      document_type: (docRes.data.document_type as DocumentType) ?? DEFAULT_DOCUMENT_TYPE,
      template_version: (docRes.data.template_version as number) ?? 1,
      created_at: docRes.data.created_at,
      updated_at: docRes.data.updated_at,
    };

    const settings = settingsRes.data ?? {
      background_knowledge_graph: true,
      background_ranking: true,
      background_suggestion: true,
      background_tonal_adjustment: true,
      suggest_insights: true,
      advanced_mode: false,
      has_chosen_template: false,
      custom_provider: "",
      custom_model: "",
    };

    return {
      conversation,
      document,
      messages: (msgRes.data ?? []).map(mapMessage),
      blocks: (blockRes.data ?? []).map(mapBlock),
      insights: (insightRes.data ?? []).map(mapInsight),
      pendingPatch: patchRes.data ? mapPatch(patchRes.data) : null,
      graphNodes: (nodeRes.data ?? []).map(mapGraphNode),
      graphEdges: (edgeRes.data ?? []).map(mapGraphEdge),
      settings: {
        backgroundAgents: {
          knowledgeGraph: settings.background_knowledge_graph,
          ranking: settings.background_ranking,
          suggestion: settings.background_suggestion,
          tonalAdjustment: settings.background_tonal_adjustment,
        },
        suggestInsights: settings.suggest_insights ?? true,
        advancedMode: settings.advanced_mode ?? false,
        hasChosenTemplate: settings.has_chosen_template ?? false,
        customProvider: settings.custom_provider ?? "",
        customModel: settings.custom_model ?? "",
      },
      exemplars: (exemplarRes.data ?? []).map((e) => ({
        exemplar_id: e.id,
        title: e.title,
        markdown: e.markdown,
        userNotes: e.user_notes,
        tags: e.tags ?? [],
        created_at: e.created_at,
      })),
    };
  }

  async addMessage(role: Message["role"], content: string): Promise<Message> {
    const { conversationId } = await this.getWorkspaceIds();
    const { data, error } = await this.db()
      .from("messages")
      .insert({
        user_id: this.userId,
        conversation_id: conversationId,
        role,
        content,
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to add message");
    return mapMessage(data);
  }

  async updateMessage(messageId: string, content: string): Promise<Message> {
    const { data, error } = await this.db()
      .from("messages")
      .update({ content })
      .eq("id", messageId)
      .eq("user_id", this.userId)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Message not found");
    return mapMessage(data);
  }

  async addInsight(params: {
    title: string;
    content: string;
    conversationId?: string | null;
    sourceMessageIds?: string[];
  }): Promise<Insight> {
    const { conversationId: defaultConvId } = await this.getWorkspaceIds();
    const { data, error } = await this.db()
      .from("insights")
      .insert({
        user_id: this.userId,
        title: params.title,
        summary: params.content.slice(0, 120),
        content: params.content,
        conversation_id: params.conversationId ?? defaultConvId,
        source_message_ids: params.sourceMessageIds ?? [],
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to add insight");
    return mapInsight(data);
  }

  async updateInsight(
    insightId: string,
    updates: Partial<{
      title: string;
      content: string;
      status: InsightStatus;
      relevance: number;
      maturity: number;
    }>
  ): Promise<Insight> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.content !== undefined) {
      payload.content = updates.content;
      payload.summary = updates.content.slice(0, 120);
    }
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.relevance !== undefined) payload.relevance = updates.relevance;
    if (updates.maturity !== undefined) payload.maturity = updates.maturity;

    const { data, error } = await this.db()
      .from("insights")
      .update(payload)
      .eq("id", insightId)
      .eq("user_id", this.userId)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Insight not found");
    return mapInsight(data);
  }

  async setDocumentTitle(title: string): Promise<Document> {
    const { documentId } = await this.getWorkspaceIds();
    const { data, error } = await this.db()
      .from("documents")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", documentId)
      .eq("user_id", this.userId)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Document not found");
    return {
      document_id: data.id,
      title: data.title,
      document_type: (data.document_type as DocumentType) ?? DEFAULT_DOCUMENT_TYPE,
      template_version: (data.template_version as number) ?? 1,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async updateDocument(params: {
    title?: string;
    documentType?: DocumentType;
  }): Promise<{ document: Document; blocks: DocumentBlock[] }> {
    const workspace = await this.getWorkspace();

    if (params.documentType && params.documentType !== workspace.document.document_type) {
      return this.changeDocumentTemplate(params.documentType);
    }

    if (params.title) {
      const document = await this.setDocumentTitle(params.title);
      return { document, blocks: workspace.blocks };
    }

    return { document: workspace.document, blocks: workspace.blocks };
  }

  async changeDocumentTemplate(
    targetType: DocumentType
  ): Promise<{ document: Document; blocks: DocumentBlock[] }> {
    const workspace = await this.getWorkspace();
    const { documentId } = await this.getWorkspaceIds();
    const { blocks, title, documentType } = changeDocumentTemplate(
      documentId,
      workspace.blocks,
      targetType
    );

    await this.replaceBlocks(blocks);

    const { data, error } = await this.db()
      .from("documents")
      .update({
        title,
        document_type: documentType,
        template_version: workspace.document.template_version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("user_id", this.userId)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to update document");

    await this.updateSettings({ has_chosen_template: true });

    return {
      document: {
        document_id: data.id,
        title: data.title,
        document_type: data.document_type as DocumentType,
        template_version: data.template_version as number,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      blocks,
    };
  }

  async seedTemplateIfNeeded(): Promise<DocumentBlock[] | null> {
    const workspace = await this.getWorkspace();
    if (workspace.blocks.length > 0) return null;

    const docType = workspace.document.document_type ?? DEFAULT_DOCUMENT_TYPE;
    if (docType === "blank") return null;

    const seeded = seedBlocks(workspace.document.document_id, docType);
    for (const block of seeded) {
      await this.db().from("document_blocks").insert({
        id: block.block_id,
        user_id: this.userId,
        document_id: workspace.document.document_id,
        content: block.content,
        block_type: block.block_type,
        position: block.position,
        linked_insights: block.linked_insights,
        source_messages: block.source_messages,
      });
    }

    if (workspace.document.title === "Untitled Document") {
      await this.setDocumentTitle(getDefaultTitle(docType));
    }

    return seeded;
  }

  async replaceBlocks(blocks: DocumentBlock[]): Promise<void> {
    const { documentId } = await this.getWorkspaceIds();
    await this.db()
      .from("document_blocks")
      .delete()
      .eq("document_id", documentId)
      .eq("user_id", this.userId);

    const now = new Date().toISOString();
    for (const block of blocks) {
      await this.db().from("document_blocks").insert({
        id: block.block_id,
        user_id: this.userId,
        document_id: documentId,
        content: block.content,
        block_type: block.block_type,
        position: block.position,
        linked_insights: block.linked_insights ?? [],
        source_messages: block.source_messages ?? [],
        created_at: block.created_at ?? now,
        updated_at: block.updated_at ?? now,
      });
    }
  }

  async previewTemplateChange(targetType: DocumentType) {
    const workspace = await this.getWorkspace();
    const { previewTemplateChange } = await import("@/lib/document-templates/change-template");
    return previewTemplateChange(workspace.blocks, targetType);
  }

  async addBlock(params: {
    content: string;
    block_type: BlockType;
    position?: number;
    linked_insights?: string[];
    source_messages?: string[];
  }): Promise<DocumentBlock> {
    const { documentId } = await this.getWorkspaceIds();
    const { data: existing } = await this.db()
      .from("document_blocks")
      .select("position")
      .eq("document_id", documentId);

    const position =
      params.position ??
      (existing?.length ? Math.max(...existing.map((b) => b.position)) + 1 : 0);

    const { data, error } = await this.db()
      .from("document_blocks")
      .insert({
        user_id: this.userId,
        document_id: documentId,
        content: params.content,
        block_type: params.block_type,
        position,
        linked_insights: params.linked_insights ?? [],
        source_messages: params.source_messages ?? [],
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to add block");
    return mapBlock(data);
  }

  async updateBlock(blockId: string, content: string): Promise<DocumentBlock> {
    const { data, error } = await this.db()
      .from("document_blocks")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", blockId)
      .eq("user_id", this.userId)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Block not found");
    return mapBlock(data);
  }

  async removeBlock(blockId: string): Promise<void> {
    const { error } = await this.db()
      .from("document_blocks")
      .delete()
      .eq("id", blockId)
      .eq("user_id", this.userId);

    if (error) throw new Error(error.message);
  }

  async createPatch(params: {
    operations: PatchOperation[];
    sourceInsightId?: string | null;
    sourceText?: string | null;
    placementLabel?: string | null;
    placementBlockId?: string | null;
  }): Promise<Patch> {
    const { documentId } = await this.getWorkspaceIds();

    await this.db()
      .from("patches")
      .update({ is_active: false })
      .eq("user_id", this.userId)
      .eq("document_id", documentId)
      .eq("is_active", true);

    const { data, error } = await this.db()
      .from("patches")
      .insert({
        user_id: this.userId,
        document_id: documentId,
        operations: params.operations,
        source_insight_id: params.sourceInsightId ?? null,
        source_text: params.sourceText ?? null,
        placement_label: params.placementLabel ?? null,
        placement_block_id: params.placementBlockId ?? null,
        status: "pending",
        is_active: true,
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to create patch");
    return mapPatch(data);
  }

  async promoteText(
    text: string,
    insightId?: string | null,
    sourceMessageIds?: string[]
  ): Promise<Patch> {
    const workspace = await this.getWorkspace();
    const result = await runAiAction<DocumentPromoteResult>(
      {
        type: "document.promote",
        input: {
          text,
          insightId: insightId ?? null,
          sourceMessageIds: sourceMessageIds ?? [],
          documentType: workspace.document.document_type,
        },
      },
      { userId: this.userId }
    );

    if (!result.success) {
      throw new Error(result.error ?? "Promotion failed");
    }

    return this.createPatch({
      operations: result.data.operations,
      sourceInsightId: insightId ?? null,
      sourceText: text,
      placementLabel: result.data.placement_label,
      placementBlockId: result.data.placement_block_id,
    });
  }

  async promoteInsight(insightId: string): Promise<Patch> {
    const { data, error } = await this.db()
      .from("insights")
      .select("*")
      .eq("id", insightId)
      .eq("user_id", this.userId)
      .single();

    if (error || !data) throw new Error("Insight not found");

    const patch = await this.promoteText(
      data.content,
      insightId,
      data.source_message_ids ?? []
    );

    await this.updateInsight(insightId, { status: "promoted" });
    return patch;
  }

  async acceptPatch(): Promise<void> {
    const workspace = await this.getWorkspace();
    if (!workspace.pendingPatch) throw new Error("No pending patch");

    await this.applyPatchOperations(workspace.pendingPatch.operations);

    await this.db()
      .from("patches")
      .update({ status: "accepted", is_active: false })
      .eq("id", workspace.pendingPatch.patch_id)
      .eq("user_id", this.userId);
  }

  async rejectPatch(): Promise<void> {
    const workspace = await this.getWorkspace();
    if (!workspace.pendingPatch) throw new Error("No pending patch");

    await this.db()
      .from("patches")
      .update({ status: "reverted", is_active: false })
      .eq("id", workspace.pendingPatch.patch_id)
      .eq("user_id", this.userId);
  }

  async applyPatchOperations(operations: PatchOperation[]): Promise<void> {
    const { documentId } = await this.getWorkspaceIds();
    const now = new Date().toISOString();

    for (const op of operations) {
      switch (op.type) {
        case "insert_block": {
          if (!op.block) break;
          await this.db().from("document_blocks").insert({
            id: op.block_id,
            user_id: this.userId,
            document_id: documentId,
            content: op.block.content ?? "",
            block_type: op.block.block_type ?? "paragraph",
            position: op.position ?? 0,
            linked_insights: op.block.linked_insights ?? [],
            source_messages: op.block.source_messages ?? [],
            created_at: now,
            updated_at: now,
          });
          break;
        }
        case "update_block": {
          await this.db()
            .from("document_blocks")
            .update({
              ...op.block,
              updated_at: now,
            })
            .eq("id", op.block_id)
            .eq("user_id", this.userId);
          break;
        }
        case "delete_block": {
          await this.db()
            .from("document_blocks")
            .delete()
            .eq("id", op.block_id)
            .eq("user_id", this.userId);
          break;
        }
        case "move_block":
          break;
      }
    }

    await this.db()
      .from("documents")
      .update({ updated_at: now })
      .eq("id", documentId);

    await this.rebuildGraph().catch(() => {});
  }

  async addGraphNode(params: {
    node_type: GraphNodeType;
    entity_id: string;
    label: string;
  }): Promise<GraphNode> {
    const { data, error } = await this.db()
      .from("graph_nodes")
      .upsert(
        {
          user_id: this.userId,
          node_type: params.node_type,
          entity_id: params.entity_id,
          label: params.label.slice(0, 60),
        },
        { onConflict: "user_id,entity_id" }
      )
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to add graph node");
    return mapGraphNode(data);
  }

  async addGraphEdge(params: {
    source_node_id: string;
    target_node_id: string;
    relationship_type: GraphEdgeRelationship;
  }): Promise<GraphEdge> {
    const { data, error } = await this.db()
      .from("graph_edges")
      .upsert(
        {
          user_id: this.userId,
          source_node_id: params.source_node_id,
          target_node_id: params.target_node_id,
          relationship_type: params.relationship_type,
        },
        { onConflict: "user_id,source_node_id,target_node_id,relationship_type" }
      )
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to add graph edge");
    return mapGraphEdge(data);
  }

  async addExemplar(params: {
    title: string;
    markdown: string;
    userNotes: string;
    tags?: string[];
  }) {
    const { data, error } = await this.db()
      .from("exemplars")
      .insert({
        user_id: this.userId,
        title: params.title,
        markdown: params.markdown,
        user_notes: params.userNotes,
        tags: params.tags ?? [],
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to add exemplar");
    return {
      exemplar_id: data.id,
      title: data.title,
      markdown: data.markdown,
      userNotes: data.user_notes,
      tags: data.tags ?? [],
      created_at: data.created_at,
    };
  }

  async removeExemplar(exemplarId: string): Promise<void> {
    const { error } = await this.db()
      .from("exemplars")
      .delete()
      .eq("id", exemplarId)
      .eq("user_id", this.userId);
    if (error) throw new Error(error.message);
  }

  async updateSettings(updates: Partial<{
    background_knowledge_graph: boolean;
    background_ranking: boolean;
    background_suggestion: boolean;
    background_tonal_adjustment: boolean;
    suggest_insights: boolean;
    advanced_mode: boolean;
    has_chosen_template: boolean;
    custom_provider: string;
    custom_model: string;
  }>) {
    const { data, error } = await this.db()
      .from("user_settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", this.userId)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to update settings");
    return data;
  }

  /** Rebuild knowledge graph in DB from current insights + document blocks. */
  async rebuildGraph(): Promise<{ nodes: number; edges: number }> {
    const workspace = await this.getWorkspace();
    const entityToNodeId = new Map<string, string>();
    let edgeCount = 0;

    for (const insight of workspace.insights) {
      if (insight.status === "archived") continue;
      const node = await this.addGraphNode({
        node_type: "insight",
        entity_id: insight.insight_id,
        label: insight.title,
      });
      entityToNodeId.set(insight.insight_id, node.node_id);
    }

    for (const block of workspace.blocks) {
      if (!block.content) continue;
      const blockNode = await this.addGraphNode({
        node_type: "document_block",
        entity_id: block.block_id,
        label: block.content.slice(0, 40),
      });
      entityToNodeId.set(block.block_id, blockNode.node_id);

      for (const insightId of block.linked_insights) {
        let sourceNodeId = entityToNodeId.get(insightId);
        if (!sourceNodeId) {
          const insight = workspace.insights.find((i) => i.insight_id === insightId);
          const node = await this.addGraphNode({
            node_type: "insight",
            entity_id: insightId,
            label: insight?.title ?? insightId.slice(0, 8),
          });
          sourceNodeId = node.node_id;
          entityToNodeId.set(insightId, sourceNodeId);
        }
        await this.addGraphEdge({
          source_node_id: sourceNodeId,
          target_node_id: blockNode.node_id,
          relationship_type: "supports",
        });
        edgeCount++;
      }
    }

    return { nodes: entityToNodeId.size, edges: edgeCount };
  }

  exportMarkdown(): string {
    throw new Error("Use getWorkspace() and export helpers");
  }
}

export function exportDocumentMarkdown(
  doc: Document,
  blocks: DocumentBlock[]
): string {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  let md = `# ${doc.title}\n\n`;
  for (const block of sorted) {
    switch (block.block_type) {
      case "heading":
        md += `## ${block.content}\n\n`;
        break;
      case "paragraph":
        md += `${block.content}\n\n`;
        break;
      case "bullet":
        md += `- ${block.content}\n`;
        break;
      case "section":
        md += `### ${block.content}\n\n`;
        break;
    }
  }
  return md.trim();
}

export function exportDocumentPlainText(
  doc: Document,
  blocks: DocumentBlock[]
): string {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  let text = `${doc.title}\n${"=".repeat(doc.title.length)}\n\n`;
  for (const block of sorted) {
    switch (block.block_type) {
      case "heading":
        text += `${block.content}\n${"-".repeat(block.content.length)}\n\n`;
        break;
      case "bullet":
        text += `• ${block.content}\n`;
        break;
      default:
        text += `${block.content}\n\n`;
        break;
    }
  }
  return text.trim();
}

export function exportDocumentPRD(
  doc: Document,
  blocks: DocumentBlock[]
): string {
  return exportByTemplate(doc, blocks);
}

export async function createApiKeyForUser(
  userId: string,
  name: string
): Promise<{ id: string; rawKey: string; prefix: string; name: string }> {
  const { generateApiKey } = await import("@/lib/auth/api-keys");
  const { rawKey, prefix, hash } = generateApiKey();
  const db = createAdminClient();

  const { data, error } = await db
    .from("api_keys")
    .insert({
      user_id: userId,
      name,
      key_prefix: prefix,
      key_hash: hash,
    })
    .select("id, name, key_prefix")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create API key");
  return { id: data.id, rawKey, prefix: data.key_prefix, name: data.name };
}

export async function listApiKeysForUser(userId: string) {
  const { data, error } = await createAdminClient()
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function deleteApiKeyForUser(userId: string, keyId: string) {
  const { error } = await createAdminClient()
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
