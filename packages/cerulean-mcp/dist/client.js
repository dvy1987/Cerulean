import { CeruleanApiError } from "./errors.js";
/**
 * Talks to your Cerulean app over the internet using your personal API key.
 * Includes timeouts and retries so flaky connections don't fail silently.
 */
export class CeruleanClient {
    config;
    constructor(config) {
        this.config = config;
    }
    baseUrl() {
        return this.config.url.replace(/\/$/, "");
    }
    async requestOnce(path, init) {
        const url = `${this.baseUrl()}${path}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
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
            let data;
            try {
                data = await res.json();
            }
            catch {
                data = null;
            }
            if (!res.ok) {
                const message = data?.error ?? `HTTP ${res.status}`;
                throw new CeruleanApiError(message, res.status, data);
            }
            return data;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async request(path, init) {
        let lastError;
        const attempts = this.config.maxRetries + 1;
        for (let i = 0; i < attempts; i++) {
            try {
                return await this.requestOnce(path, init);
            }
            catch (err) {
                lastError = err;
                const retryable = err instanceof CeruleanApiError
                    ? (err.statusCode ?? 0) >= 500
                    : err instanceof Error && err.name === "AbortError";
                if (!retryable || i === attempts - 1)
                    throw err;
                await new Promise((r) => setTimeout(r, 500 * (i + 1)));
            }
        }
        throw lastError;
    }
    /** Quick health check — proves URL + API key work */
    async verifyConnection() {
        const ws = await this.getWorkspace();
        return {
            connected: true,
            messageCount: ws.messages?.length ?? 0,
            insightCount: ws.insights?.length ?? 0,
            blockCount: ws.blocks?.length ?? 0,
            hasPendingPatch: Boolean(ws.pendingPatch),
            documentTitle: ws.document?.title ?? "Untitled",
        };
    }
    getWorkspace() {
        return this.request("/api/v1/workspace");
    }
    listMessages() {
        return this.request("/api/v1/messages");
    }
    addMessage(role, content) {
        return this.request("/api/v1/messages", {
            method: "POST",
            body: JSON.stringify({ role, content }),
        });
    }
    updateMessage(id, content) {
        return this.request(`/api/v1/messages/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ content }),
        });
    }
    listInsights() {
        return this.request("/api/v1/insights");
    }
    addInsight(title, content, extra) {
        return this.request("/api/v1/insights", {
            method: "POST",
            body: JSON.stringify({ title, content, ...extra }),
        });
    }
    updateInsight(id, updates) {
        return this.request(`/api/v1/insights/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updates),
        });
    }
    promoteInsight(id) {
        return this.request(`/api/v1/insights/${id}/promote`, {
            method: "POST",
        });
    }
    extractInsights(text) {
        return this.request("/api/v1/insights/extract", { method: "POST", body: JSON.stringify({ text }) });
    }
    insightToPrompt(insightTitle, insightContent) {
        return this.request("/api/v1/insights/to-prompt", {
            method: "POST",
            body: JSON.stringify({ insightTitle, insightContent }),
        });
    }
    getDocument() {
        return this.request("/api/v1/document");
    }
    setDocumentTitle(title) {
        return this.request("/api/v1/document", {
            method: "PATCH",
            body: JSON.stringify({ title }),
        });
    }
    addBlock(body) {
        return this.request("/api/v1/blocks", {
            method: "POST",
            body: JSON.stringify(body),
        });
    }
    updateBlock(id, content) {
        return this.request(`/api/v1/blocks/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ content }),
        });
    }
    removeBlock(id) {
        return this.request(`/api/v1/blocks/${id}`, {
            method: "DELETE",
        });
    }
    getPendingPatch() {
        return this.request("/api/v1/patches");
    }
    createPatch(body) {
        return this.request("/api/v1/patches", {
            method: "POST",
            body: JSON.stringify(body),
        });
    }
    acceptPatch() {
        return this.request("/api/v1/patches/accept", { method: "POST" });
    }
    rejectPatch() {
        return this.request("/api/v1/patches/reject", {
            method: "POST",
        });
    }
    getGraph() {
        return this.request("/api/v1/graph");
    }
    addGraphNode(node_type, entity_id, label) {
        return this.request("/api/v1/graph", {
            method: "POST",
            body: JSON.stringify({ action: "add_node", node_type, entity_id, label }),
        });
    }
    addGraphEdge(source_node_id, target_node_id, relationship_type) {
        return this.request("/api/v1/graph", {
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
        return this.request("/api/v1/exemplars");
    }
    addExemplar(title, markdown, userNotes) {
        return this.request("/api/v1/exemplars", {
            method: "POST",
            body: JSON.stringify({ title, markdown, userNotes }),
        });
    }
    removeExemplar(id) {
        return this.request(`/api/v1/exemplars/${id}`, {
            method: "DELETE",
        });
    }
    getSettings() {
        return this.request("/api/v1/settings");
    }
    updateSettings(body) {
        return this.request("/api/v1/settings", {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    }
    exportDocument(format) {
        return this.request(`/api/v1/export?format=${format}`);
    }
    syncGraph() {
        return this.request("/api/v1/graph/sync", { method: "POST" });
    }
    runAiAction(action) {
        return this.request("/api/v1/ai/run", {
            method: "POST",
            body: JSON.stringify({ action }),
        });
    }
}
