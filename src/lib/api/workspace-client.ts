import type { WorkspaceSnapshot } from "@/lib/db/workspace-service";
import type { DocumentType, ThinkingSuggestion, ProposedInsight, Contradiction, Message } from "@/types";
import { useChatStore } from "@/store/chatStore";
import { useDocumentStore } from "@/store/documentStore";
import { useInsightStore } from "@/store/insightStore";
import { useGraphStore } from "@/store/graphStore";
import { useMemoryStore } from "@/store/memoryStore";
import { useAiSettingsStore } from "@/store/aiSettingsStore";
import { useProposedInsightStore } from "@/store/proposedInsightStore";
import { useSuggestionStore } from "@/store/suggestionStore";
import { useContradictionStore } from "@/store/contradictionStore";
import { trackMetric } from "@/lib/metrics/session-metrics";
import { isPersistenceEnabled } from "@/lib/config";
import { runAiAction } from "@/lib/ai/orchestrator";
import { buildAgentContextFromStores } from "@/lib/ai/context-from-stores";
import { runPostChatPipeline, PostChatPipelineResult } from "@/lib/ai/post-chat-pipeline";
import { ChatRespondResult } from "@/lib/ai/actions";

export function hydrateStoresFromWorkspace(workspace: WorkspaceSnapshot) {
  useChatStore.setState({
    conversation: workspace.conversation,
    messages: workspace.messages,
    isStreaming: false,
  });

  useDocumentStore.setState({
    document: workspace.document,
    blocks: workspace.blocks,
    pendingPatch: workspace.pendingPatch,
  });

  useInsightStore.setState({
    insights: workspace.insights,
  });

  useGraphStore.setState({
    nodes: workspace.graphNodes,
    edges: workspace.graphEdges,
  });

  useMemoryStore.setState({
    exemplars: workspace.exemplars.map((e) => ({
      exemplar_id: e.exemplar_id,
      title: e.title,
      markdown: e.markdown,
      userNotes: e.userNotes,
      tags: e.tags,
      created_at: e.created_at,
    })),
  });

  useAiSettingsStore.setState({
    backgroundAgents: workspace.settings.backgroundAgents,
    suggestInsights: workspace.settings.suggestInsights ?? true,
    advancedMode: workspace.settings.advancedMode ?? false,
    hasChosenTemplate: workspace.settings.hasChosenTemplate ?? false,
    customProvider: (workspace.settings.customProvider || "") as "",
    customModel: workspace.settings.customModel,
  });
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function applyPostChatResults(
  postChat: PostChatPipelineResult,
  assistantMessageId: string
) {
  if (postChat.proposals.length > 0) {
    useProposedInsightStore
      .getState()
      .setProposals(postChat.proposals, assistantMessageId);
    trackMetric("proposals_shown", { count: postChat.proposals.length });
  }
  if (postChat.suggestions.length > 0) {
    useSuggestionStore.getState().setSuggestions(postChat.suggestions);
  }
  if (postChat.contradictions.length > 0) {
    useContradictionStore.getState().setContradictions(postChat.contradictions);
  }
  const scores = postChat.insightScores;
  if (Object.keys(scores).length > 0) {
    const { setInsightScores } = useInsightStore.getState();
    for (const [insightId, s] of Object.entries(scores)) {
      setInsightScores(insightId, s.relevance, s.maturity);
    }
  }
}

export const workspaceApi = {
  async load() {
    const data = await apiFetch("/api/v1/workspace");
    hydrateStoresFromWorkspace(data as WorkspaceSnapshot);
    const workspace = data as WorkspaceSnapshot;
    if (workspace.blocks.length === 0 && workspace.document.document_type !== "blank") {
      try {
        const seed = await apiFetch("/api/v1/document/seed-template", { method: "POST" });
        if (seed.blocks?.length) {
          useDocumentStore.setState({
            blocks: seed.blocks,
            document: seed.document ?? workspace.document,
          });
        }
      } catch {
        // seed optional when columns not migrated yet
      }
    }
    return data as WorkspaceSnapshot;
  },

  async streamChat(
    userMessage: string
  ): Promise<{
    assistantMessageId: string;
    proposals: ProposedInsight[];
    suggestions: ThinkingSuggestion[];
    contradictions: Contradiction[];
  }> {
    const res = await fetch("/api/v1/ai/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Chat stream failed");
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response stream");

    const decoder = new TextDecoder();
    let buffer = "";
    let assistantMessageId = "";
    let accumulated = "";
    let proposals: ProposedInsight[] = [];
    let suggestions: ThinkingSuggestion[] = [];
    let contradictions: Contradiction[] = [];
    let postChatResult: PostChatPipelineResult | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = JSON.parse(line.slice(6)) as Record<string, unknown>;

        if (payload.type === "init") {
          const userMsg = payload.userMessage as Message;
          const assistantMsg = payload.assistantMessage as Message;
          assistantMessageId = assistantMsg.message_id;
          useChatStore.setState((s) => ({
            messages: [...s.messages, userMsg, assistantMsg],
          }));
        }

        if (payload.type === "chunk" && typeof payload.text === "string") {
          accumulated += payload.text;
          if (assistantMessageId) {
            useChatStore.getState().updateMessage(assistantMessageId, accumulated);
          }
        }

        if (payload.type === "done" && typeof payload.assistantMessageId === "string") {
          assistantMessageId = payload.assistantMessageId;
        }

        if (payload.type === "postChat") {
          proposals = (payload.proposals as ProposedInsight[]) ?? [];
          suggestions = (payload.suggestions as ThinkingSuggestion[]) ?? [];
          contradictions = (payload.contradictions as Contradiction[]) ?? [];
          postChatResult = {
            proposals,
            suggestions,
            contradictions,
            insightScores:
              (payload.insightScores as PostChatPipelineResult["insightScores"]) ?? {},
          };
        }

        if (payload.type === "error") {
          throw new Error(String(payload.message ?? "Stream error"));
        }
      }
    }

    if (postChatResult) {
      applyPostChatResults(postChatResult, assistantMessageId);
    }

    return { assistantMessageId, proposals, suggestions, contradictions };
  },

  async streamChatLocal(
    userMessage: string,
    onChunk: (text: string) => void,
    assistantMessageId: string
  ) {
    const context = buildAgentContextFromStores();
    const settings = useAiSettingsStore.getState();

    let accumulated = "";
    const result = await runAiAction<ChatRespondResult>(
      { type: "chat.respond", input: { userMessage } },
      {
        context,
        onChunk: (chunk) => {
          accumulated += chunk;
          onChunk(chunk);
        },
      }
    );

    if (!result.success) throw new Error(result.error ?? "Chat failed");

    const postChat = await runPostChatPipeline({
      context: buildAgentContextFromStores(),
      assistantMessageId,
      userMessage,
      assistantMessage: accumulated || result.data.response,
      settings: {
        backgroundAgents: settings.backgroundAgents,
        suggestInsights: settings.suggestInsights,
      },
    });

    applyPostChatResults(postChat, assistantMessageId);
    return postChat;
  },

  async promoteText(text: string, sourceMessageIds: string[] = []) {
    const { patch } = await apiFetch("/api/v1/patches", {
      method: "POST",
      body: JSON.stringify({ text, sourceMessageIds }),
    });
    useDocumentStore.getState().setPendingPatch(patch);
    trackMetric("promotion_created");
    return patch;
  },

  async previewTemplateChange(documentType: DocumentType) {
    return apiFetch("/api/v1/document/preview-template-change", {
      method: "POST",
      body: JSON.stringify({ documentType }),
    });
  },

  async changeDocumentTemplate(documentType: DocumentType) {
    const data = await apiFetch("/api/v1/document", {
      method: "PATCH",
      body: JSON.stringify({ documentType }),
    });
    useDocumentStore.setState({
      document: data.document,
      blocks: data.blocks,
    });
    useAiSettingsStore.getState().setHasChosenTemplate(true);
    return data;
  },

  async applyDocumentType(documentType: DocumentType) {
    if (isPersistenceEnabled()) {
      const data = await apiFetch("/api/v1/document", {
        method: "PATCH",
        body: JSON.stringify({ documentType }),
      });
      useDocumentStore.setState({
        document: data.document,
        blocks: data.blocks,
      });
      useAiSettingsStore.getState().setHasChosenTemplate(true);
      return data;
    }
    useDocumentStore.getState().applyTemplate(documentType);
    useAiSettingsStore.getState().setHasChosenTemplate(true);
  },

  async addMessage(role: "user" | "assistant", content: string) {
    const { message } = await apiFetch("/api/v1/messages", {
      method: "POST",
      body: JSON.stringify({ role, content }),
    });
    useChatStore.setState((s) => ({
      messages: [...s.messages, message],
    }));
    return message;
  },

  async updateMessage(messageId: string, content: string) {
    await apiFetch(`/api/v1/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
    useChatStore.getState().updateMessage(messageId, content);
  },

  /** Save assistant message once when streaming completes (avoids hundreds of DB writes). */
  async finalizeMessage(messageId: string, content: string) {
    await apiFetch(`/api/v1/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
    useChatStore.getState().updateMessage(messageId, content);
  },

  async addInsight(params: {
    title: string;
    content: string;
    conversationId?: string | null;
    sourceMessageIds?: string[];
  }) {
    const { insight } = await apiFetch("/api/v1/insights", {
      method: "POST",
      body: JSON.stringify(params),
    });
    useInsightStore.setState((s) => ({
      insights: [...s.insights, insight],
      isTrayOpen: true,
      trayMode: "open",
    }));
    return insight;
  },

  async updateInsight(insightId: string, updates: Record<string, unknown>) {
    const { insight } = await apiFetch(`/api/v1/insights/${insightId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    useInsightStore.setState((s) => ({
      insights: s.insights.map((i) =>
        i.insight_id === insightId ? insight : i
      ),
    }));
    return insight;
  },

  async setPendingPatchFromPromote(insightId?: string, text?: string) {
    const body = insightId
      ? undefined
      : { text };
    const path = insightId
      ? `/api/v1/insights/${insightId}/promote`
      : "/api/v1/patches";
    const { patch } = await apiFetch(path, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
    useDocumentStore.getState().setPendingPatch(patch);
    if (insightId) {
      useInsightStore.getState().setInsightStatus(insightId, "promoted");
    }
    return patch;
  },

  async createPatch(body: Record<string, unknown>) {
    const { patch } = await apiFetch("/api/v1/patches", {
      method: "POST",
      body: JSON.stringify(body),
    });
    useDocumentStore.getState().setPendingPatch(patch);
    return patch;
  },

  async acceptPatch() {
    const data = await apiFetch("/api/v1/patches/accept", { method: "POST" });
    useDocumentStore.setState({
      blocks: data.blocks,
      document: data.document,
      pendingPatch: null,
    });
    if (isPersistenceEnabled()) {
      const syncData = await apiFetch("/api/v1/graph/sync", { method: "POST" });
      if (syncData.graphNodes && syncData.graphEdges) {
        useGraphStore.setState({
          nodes: syncData.graphNodes,
          edges: syncData.graphEdges,
        });
      }
    }
  },

  async rejectPatch() {
    await apiFetch("/api/v1/patches/reject", { method: "POST" });
    useDocumentStore.getState().rejectPatch();
  },

  async updateBlock(blockId: string, content: string) {
    await apiFetch(`/api/v1/blocks/${blockId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
    useDocumentStore.getState().updateBlockContent(blockId, content);
  },

  async addBlock(params: {
    content: string;
    block_type: string;
    position?: number;
  }) {
    const { block } = await apiFetch("/api/v1/blocks", {
      method: "POST",
      body: JSON.stringify(params),
    });
    useDocumentStore.setState((s) => ({
      blocks: [...s.blocks, block].sort((a, b) => a.position - b.position),
    }));
    return block;
  },

  async removeBlock(blockId: string) {
    await apiFetch(`/api/v1/blocks/${blockId}`, { method: "DELETE" });
    useDocumentStore.getState().removeBlock(blockId);
  },

  async setDocumentTitle(title: string) {
    const { document } = await apiFetch("/api/v1/document", {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
    useDocumentStore.getState().setDocumentTitle(document.title);
  },

  async extractInsights(text: string) {
    const { insights } = await apiFetch("/api/v1/insights/extract", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    useInsightStore.setState((s) => ({
      insights: [...s.insights, ...insights],
      isTrayOpen: true,
    }));
    return insights;
  },

  async addExemplar(params: {
    title: string;
    markdown: string;
    userNotes: string;
  }) {
    const { exemplar } = await apiFetch("/api/v1/exemplars", {
      method: "POST",
      body: JSON.stringify({
        title: params.title,
        markdown: params.markdown,
        userNotes: params.userNotes,
      }),
    });
    useMemoryStore.getState().addExemplar({
      title: exemplar.title,
      markdown: exemplar.markdown,
      userNotes: exemplar.userNotes,
    });
    return exemplar;
  },

  async runAiAction(action: unknown) {
    return apiFetch("/api/v1/ai/run", {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  },

  async syncGraph() {
    const data = await apiFetch("/api/v1/graph/sync", { method: "POST" });
    if (data.graphNodes && data.graphEdges) {
      useGraphStore.setState({
        nodes: data.graphNodes,
        edges: data.graphEdges,
      });
    }
    return data;
  },

  async updateSettings(toggle: Partial<{
    knowledgeGraph: boolean;
    ranking: boolean;
    suggestion: boolean;
    tonalAdjustment: boolean;
    suggestInsights: boolean;
    advancedMode: boolean;
  }>) {
    const current = useAiSettingsStore.getState();
    const mergedBg = { ...current.backgroundAgents };
    if (toggle.knowledgeGraph !== undefined) mergedBg.knowledgeGraph = toggle.knowledgeGraph;
    if (toggle.ranking !== undefined) mergedBg.ranking = toggle.ranking;
    if (toggle.suggestion !== undefined) mergedBg.suggestion = toggle.suggestion;
    if (toggle.tonalAdjustment !== undefined) mergedBg.tonalAdjustment = toggle.tonalAdjustment;

    const payload: Record<string, unknown> = {};
    if (Object.keys(mergedBg).length) {
      payload.backgroundAgents = mergedBg;
    }
    if (toggle.suggestInsights !== undefined) payload.suggestInsights = toggle.suggestInsights;
    if (toggle.advancedMode !== undefined) payload.advancedMode = toggle.advancedMode;

    const { settings } = await apiFetch("/api/v1/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const s = settings as {
      backgroundAgents?: typeof mergedBg;
      suggestInsights?: boolean;
      advancedMode?: boolean;
    };
    useAiSettingsStore.setState({
      backgroundAgents: s.backgroundAgents ?? mergedBg,
      suggestInsights: s.suggestInsights ?? current.suggestInsights,
      advancedMode: s.advancedMode ?? current.advancedMode,
    });
    return settings;
  },

  async removeExemplar(exemplarId: string) {
    await apiFetch(`/api/v1/exemplars/${exemplarId}`, { method: "DELETE" });
    useMemoryStore.getState().removeExemplar(exemplarId);
  },
};
