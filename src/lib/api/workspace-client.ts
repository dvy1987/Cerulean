import type { WorkspaceSnapshot } from "@/lib/db/workspace-service";
import { useChatStore } from "@/store/chatStore";
import { useDocumentStore } from "@/store/documentStore";
import { useInsightStore } from "@/store/insightStore";
import { useGraphStore } from "@/store/graphStore";
import { useMemoryStore } from "@/store/memoryStore";
import { useAiSettingsStore } from "@/store/aiSettingsStore";
import { isPersistenceEnabled } from "@/lib/config";

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

export const workspaceApi = {
  async load() {
    const data = await apiFetch("/api/v1/workspace");
    hydrateStoresFromWorkspace(data as WorkspaceSnapshot);
    return data as WorkspaceSnapshot;
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
  }>) {
    const current = useAiSettingsStore.getState().backgroundAgents;
    const merged = { ...current, ...toggle };
    const { settings } = await apiFetch("/api/v1/settings", {
      method: "PATCH",
      body: JSON.stringify({ backgroundAgents: merged }),
    });
    useAiSettingsStore.setState({
      backgroundAgents:
        (settings as { backgroundAgents: typeof merged }).backgroundAgents ?? merged,
    });
    return settings;
  },

  async removeExemplar(exemplarId: string) {
    await apiFetch(`/api/v1/exemplars/${exemplarId}`, { method: "DELETE" });
    useMemoryStore.getState().removeExemplar(exemplarId);
  },
};
