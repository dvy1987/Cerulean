import { CeruleanConfig } from "./config.js";
/**
 * Talks to your Cerulean app over the internet using your personal API key.
 * Includes timeouts and retries so flaky connections don't fail silently.
 */
export declare class CeruleanClient {
    private config;
    constructor(config: CeruleanConfig);
    private baseUrl;
    private requestOnce;
    request<T>(path: string, init?: RequestInit): Promise<T>;
    /** Quick health check — proves URL + API key work */
    verifyConnection(): Promise<{
        connected: boolean;
        messageCount: number;
        insightCount: number;
        blockCount: number;
        hasPendingPatch: boolean;
        documentTitle: string;
    }>;
    getWorkspace(): Promise<Record<string, unknown>>;
    listMessages(): Promise<{
        messages: unknown[];
    }>;
    addMessage(role: "user" | "assistant", content: string): Promise<{
        message: unknown;
    }>;
    updateMessage(id: string, content: string): Promise<{
        message: unknown;
    }>;
    listInsights(): Promise<{
        insights: unknown[];
    }>;
    addInsight(title: string, content: string, extra?: Record<string, unknown>): Promise<{
        insight: unknown;
    }>;
    updateInsight(id: string, updates: Record<string, unknown>): Promise<{
        insight: unknown;
    }>;
    promoteInsight(id: string): Promise<{
        patch: unknown;
    }>;
    extractInsights(text: string): Promise<{
        insights: unknown[];
        count: number;
    }>;
    insightToPrompt(insightTitle: string, insightContent: string): Promise<{
        prompt: string;
    }>;
    getDocument(): Promise<{
        document: unknown;
        blocks: unknown[];
    }>;
    setDocumentTitle(title: string): Promise<{
        document: unknown;
    }>;
    addBlock(body: Record<string, unknown>): Promise<{
        block: unknown;
    }>;
    updateBlock(id: string, content: string): Promise<{
        block: unknown;
    }>;
    removeBlock(id: string): Promise<{
        success: boolean;
    }>;
    getPendingPatch(): Promise<{
        patch: unknown;
    }>;
    createPatch(body: Record<string, unknown>): Promise<{
        patch: unknown;
    }>;
    acceptPatch(): Promise<{
        success: boolean;
        blocks: unknown[];
        document: unknown;
    }>;
    rejectPatch(): Promise<{
        success: boolean;
    }>;
    getGraph(): Promise<{
        nodes: unknown[];
        edges: unknown[];
    }>;
    addGraphNode(node_type: string, entity_id: string, label: string): Promise<{
        node: unknown;
    }>;
    addGraphEdge(source_node_id: string, target_node_id: string, relationship_type: string): Promise<{
        edge: unknown;
    }>;
    listExemplars(): Promise<{
        exemplars: unknown[];
    }>;
    addExemplar(title: string, markdown: string, userNotes: string): Promise<{
        exemplar: unknown;
    }>;
    removeExemplar(id: string): Promise<{
        success: boolean;
    }>;
    getSettings(): Promise<{
        settings: unknown;
    }>;
    updateSettings(body: Record<string, unknown>): Promise<{
        settings: unknown;
    }>;
    exportDocument(format: "markdown" | "text" | "prd"): Promise<{
        content: string;
        title: string;
        format: string;
    }>;
    syncGraph(): Promise<unknown>;
    runAiAction(action: Record<string, unknown>): Promise<{
        result: unknown;
    }>;
}
