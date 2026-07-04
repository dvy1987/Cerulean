import { CeruleanConfig } from "./config.js";
import { CeruleanApiError } from "./errors.js";

/**
 * Talks to your Cerulean app over the internet using your personal API key.
 * Includes timeouts and retries so flaky connections don't fail silently.
 */
export class CeruleanClient {
  constructor(private config: CeruleanConfig) {}

  private baseUrl(): string {
    return this.config.url.replace(/\/$/, "");
  }

  private async requestOnce<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl()}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.requestTimeoutMs
    );

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "User-Agent": "cerulean-mcp/0.2.0",
          ...init?.headers,
        },
      });

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const message =
          (data as { error?: string })?.error ?? `HTTP ${res.status}`;
        throw new CeruleanApiError(message, res.status, data);
      }

      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    let lastError: unknown;
    const attempts = this.config.maxRetries + 1;

    for (let i = 0; i < attempts; i++) {
      try {
        return await this.requestOnce<T>(path, init);
      } catch (err) {
        lastError = err;
        const retryable =
          err instanceof CeruleanApiError
            ? (err.statusCode ?? 0) >= 500
            : err instanceof Error && err.name === "AbortError";

        if (!retryable || i === attempts - 1) throw err;
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }

    throw lastError;
  }

  /** Quick health check — proves URL + API key work */
  async verifyConnection(): Promise<{
    connected: boolean;
    messageCount: number;
    insightCount: number;
    blockCount: number;
    hasPendingPatch: boolean;
    documentTitle: string;
  }> {
    const ws = await this.getWorkspace();
    return {
      connected: true,
      messageCount: (ws.messages as unknown[])?.length ?? 0,
      insightCount: (ws.insights as unknown[])?.length ?? 0,
      blockCount: (ws.blocks as unknown[])?.length ?? 0,
      hasPendingPatch: Boolean(ws.pendingPatch),
      documentTitle: (ws.document as { title?: string })?.title ?? "Untitled",
    };
  }

  getWorkspace() {
    return this.request<Record<string, unknown>>("/api/v1/workspace");
  }

  listMessages() {
    return this.request<{ messages: unknown[] }>("/api/v1/messages");
  }

  addMessage(role: "user" | "assistant", content: string) {
    return this.request<{ message: unknown }>("/api/v1/messages", {
      method: "POST",
      body: JSON.stringify({ role, content }),
    });
  }

  updateMessage(id: string, content: string) {
    return this.request<{ message: unknown }>(`/api/v1/messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  }

  listInsights() {
    return this.request<{ insights: unknown[] }>("/api/v1/insights");
  }

  addInsight(title: string, content: string, extra?: Record<string, unknown>) {
    return this.request<{ insight: unknown }>("/api/v1/insights", {
      method: "POST",
      body: JSON.stringify({ title, content, ...extra }),
    });
  }

  updateInsight(id: string, updates: Record<string, unknown>) {
    return this.request<{ insight: unknown }>(`/api/v1/insights/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  promoteInsight(id: string) {
    return this.request<{ patch: unknown }>(`/api/v1/insights/${id}/promote`, {
      method: "POST",
    });
  }

  extractInsights(text: string) {
    return this.request<{ insights: unknown[]; count: number }>(
      "/api/v1/insights/extract",
      { method: "POST", body: JSON.stringify({ text }) }
    );
  }

  insightToPrompt(insightTitle: string, insightContent: string) {
    return this.request<{ prompt: string }>("/api/v1/insights/to-prompt", {
      method: "POST",
      body: JSON.stringify({ insightTitle, insightContent }),
    });
  }

  getDocument() {
    return this.request<{ document: unknown; blocks: unknown[] }>(
      "/api/v1/document"
    );
  }

  setDocumentTitle(title: string) {
    return this.request<{ document: unknown }>("/api/v1/document", {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
  }

  addBlock(body: Record<string, unknown>) {
    return this.request<{ block: unknown }>("/api/v1/blocks", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  updateBlock(id: string, content: string) {
    return this.request<{ block: unknown }>(`/api/v1/blocks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  }

  removeBlock(id: string) {
    return this.request<{ success: boolean }>(`/api/v1/blocks/${id}`, {
      method: "DELETE",
    });
  }

  getPendingPatch() {
    return this.request<{ patch: unknown }>("/api/v1/patches");
  }

  createPatch(body: Record<string, unknown>) {
    return this.request<{ patch: unknown }>("/api/v1/patches", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  acceptPatch() {
    return this.request<{
      success: boolean;
      blocks: unknown[];
      document: unknown;
    }>("/api/v1/patches/accept", { method: "POST" });
  }

  rejectPatch() {
    return this.request<{ success: boolean }>("/api/v1/patches/reject", {
      method: "POST",
    });
  }

  getGraph() {
    return this.request<{ nodes: unknown[]; edges: unknown[] }>(
      "/api/v1/graph"
    );
  }

  addGraphNode(node_type: string, entity_id: string, label: string) {
    return this.request<{ node: unknown }>("/api/v1/graph", {
      method: "POST",
      body: JSON.stringify({ action: "add_node", node_type, entity_id, label }),
    });
  }

  addGraphEdge(
    source_node_id: string,
    target_node_id: string,
    relationship_type: string
  ) {
    return this.request<{ edge: unknown }>("/api/v1/graph", {
      method: "POST",
      body: JSON.stringify({
        action: "add_edge",
        source_node_id,
        target_node_id,
        relationship_type,
      }),
    });
  }

  listExemplars() {
    return this.request<{ exemplars: unknown[] }>("/api/v1/exemplars");
  }

  addExemplar(title: string, markdown: string, userNotes: string) {
    return this.request<{ exemplar: unknown }>("/api/v1/exemplars", {
      method: "POST",
      body: JSON.stringify({ title, markdown, userNotes }),
    });
  }

  removeExemplar(id: string) {
    return this.request<{ success: boolean }>(`/api/v1/exemplars/${id}`, {
      method: "DELETE",
    });
  }

  getSettings() {
    return this.request<{ settings: unknown }>("/api/v1/settings");
  }

  updateSettings(body: Record<string, unknown>) {
    return this.request<{ settings: unknown }>("/api/v1/settings", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  exportDocument(format: "markdown" | "text" | "prd") {
    return this.request<{ content: string; title: string; format: string }>(
      `/api/v1/export?format=${format}`
    );
  }

  syncGraph() {
    return this.request("/api/v1/graph/sync", { method: "POST" });
  }

  runAiAction(action: Record<string, unknown>) {
    return this.request<{ result: unknown }>("/api/v1/ai/run", {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  }
}
