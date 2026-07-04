import { z } from "zod";
import { findInsightByQuery, safeTool } from "./helpers.js";
export function registerCeruleanTools(server, client) {
    // ─── Connection & discovery ───
    server.tool("cerulean_verify_connection", "ALWAYS call this first when starting Cerulean work. Checks that your API key works and returns a quick summary of your workspace (message count, insights, document title).", {}, async () => safeTool("Connected to Cerulean", () => client.verifyConnection()));
    server.tool("cerulean_help", "Lists what Cerulean MCP can do and suggested workflows in plain language.", {}, async () => safeTool("Cerulean MCP help", async () => ({
        what_is_this: "Cerulean MCP lets Cursor/Antigravity read and update YOUR thinking workspace (chat, insights, document) on Railway.",
        common_workflows: [
            "1. verify_connection → get_workspace",
            "2. Discuss ideas → save_chat_turn",
            "3. User likes an idea → add_insight",
            "4. User says promote → promote_by_search or promote_insight",
            "5. Review patch → get_pending_patch → accept_patch (only if user asks)",
        ],
        key_tools: {
            verify: "cerulean_verify_connection",
            load_all: "cerulean_get_workspace",
            save_chat: "cerulean_save_chat_turn",
            capture_idea: "cerulean_add_insight",
            promote: "cerulean_promote_by_search | cerulean_promote_insight | cerulean_promote_text",
            document: "cerulean_get_document | cerulean_export_document",
        },
        security: "Your API key only accesses your account. Other users cannot see your data.",
    })));
    // ─── Workspace ───
    server.tool("cerulean_get_workspace", "Load everything: messages, insights, document blocks, pending patch, graph, settings. Use before making changes.", {}, async () => safeTool("Workspace loaded", () => client.getWorkspace()));
    // ─── Chat ───
    server.tool("cerulean_list_messages", "List all chat messages in the current conversation.", {}, async () => safeTool("Messages listed", () => client.listMessages()));
    server.tool("cerulean_add_message", "Add one chat message (user or assistant).", {
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
    }, async ({ role, content }) => safeTool("Message saved", () => client.addMessage(role, content)));
    server.tool("cerulean_save_chat_turn", "Save a complete back-and-forth: what the user said AND what the assistant replied. Use after each meaningful exchange so the Cerulean web app stays in sync.", {
        user_message: z.string().min(1),
        assistant_message: z.string().min(1),
    }, async ({ user_message, assistant_message }) => safeTool("Chat turn saved", async () => {
        const user = await client.addMessage("user", user_message);
        const assistant = await client.addMessage("assistant", assistant_message);
        return { user: user.message, assistant: assistant.message };
    }));
    server.tool("cerulean_update_message", "Update an existing message (e.g. while streaming a long reply).", {
        message_id: z.string().uuid(),
        content: z.string(),
    }, async ({ message_id, content }) => safeTool("Message updated", () => client.updateMessage(message_id, content)));
    // ─── Insights ───
    server.tool("cerulean_list_insights", "List all insights in the tray (excluding archived unless you filter client-side).", {}, async () => safeTool("Insights listed", () => client.listInsights()));
    server.tool("cerulean_find_insight", "Search insights by keyword in title or content. Use when the user says 'the insight about X' without giving an ID.", {
        query: z.string().min(1).describe("Keywords to search for, e.g. 'onboarding friction'"),
    }, async ({ query }) => safeTool("Insight search complete", () => findInsightByQuery(client, query)));
    server.tool("cerulean_add_insight", "Capture a new insight. Use when the user says they like an idea or want to save it for later.", {
        title: z.string().min(1),
        content: z.string().min(1),
    }, async ({ title, content }) => safeTool("Insight captured", () => client.addInsight(title, content)));
    server.tool("cerulean_update_insight", "Update an insight's title, content, status, relevance, or maturity.", {
        insight_id: z.string().uuid(),
        title: z.string().optional(),
        content: z.string().optional(),
        status: z
            .enum(["captured", "discussing", "resolved", "promoted", "archived"])
            .optional(),
        relevance: z.number().min(0).max(10).optional(),
        maturity: z.number().min(0).max(10).optional(),
    }, async ({ insight_id, ...updates }) => safeTool("Insight updated", () => client.updateInsight(insight_id, updates)));
    server.tool("cerulean_archive_insight", "Archive an insight (hide from active tray).", { insight_id: z.string().uuid() }, async ({ insight_id }) => safeTool("Insight archived", () => client.updateInsight(insight_id, { status: "archived" })));
    server.tool("cerulean_promote_insight", "Promote a specific insight to the document by ID. Creates a PENDING patch — does not change the document until accepted.", { insight_id: z.string().uuid() }, async ({ insight_id }) => safeTool("Promotion patch created — awaiting accept", () => client.promoteInsight(insight_id)));
    server.tool("cerulean_promote_by_search", "When the user says 'promote the insight about X' — searches for the insight, then creates a promotion patch. Best for natural language requests.", {
        query: z.string().min(1).describe("What the insight is about, e.g. 'user onboarding'"),
    }, async ({ query }) => safeTool("Promotion patch created — awaiting accept", async () => {
        const { insight, matches } = await findInsightByQuery(client, query);
        if (!insight) {
            throw new Error(`No insight found matching "${query}". Try cerulean_list_insights or cerulean_add_insight first.`);
        }
        if (matches.length > 1) {
            return {
                warning: "Multiple insights matched — promoted the best match. Review matches list.",
                matches: matches.map((m) => ({ id: m.insight_id, title: m.title })),
                promoted: await client.promoteInsight(String(insight.insight_id)),
            };
        }
        return {
            insight: { id: insight.insight_id, title: insight.title },
            patch: (await client.promoteInsight(String(insight.insight_id))).patch,
        };
    }));
    server.tool("cerulean_promote_text", "Promote any text (e.g. a chat excerpt) to the document. Creates a pending patch.", { text: z.string().min(1) }, async ({ text }) => safeTool("Promotion patch created — awaiting accept", () => client.createPatch({ text })));
    server.tool("cerulean_extract_insights_from_text", "Import text and split into insights (basic splitting). For smarter extraction, analyze the text yourself then call cerulean_add_insight.", { text: z.string().min(20) }, async ({ text }) => safeTool("Insights extracted", () => client.extractInsights(text)));
    server.tool("cerulean_insight_to_prompt", "Turn an insight into a chat prompt for deeper exploration.", {
        insight_title: z.string(),
        insight_content: z.string(),
    }, async ({ insight_title, insight_content }) => safeTool("Prompt generated", () => client.insightToPrompt(insight_title, insight_content)));
    // ─── Document ───
    server.tool("cerulean_get_document", "Get document title and all blocks.", {}, async () => safeTool("Document loaded", () => client.getDocument()));
    server.tool("cerulean_set_document_title", "Rename the document.", { title: z.string().min(1) }, async ({ title }) => safeTool("Title updated", () => client.setDocumentTitle(title)));
    server.tool("cerulean_add_block", "Add a new block to the document directly (bypasses patch review). Use for manual edits; prefer patches for AI integration.", {
        content: z.string(),
        block_type: z
            .enum(["heading", "paragraph", "bullet", "section"])
            .default("paragraph"),
        position: z.number().optional(),
    }, async ({ content, block_type, position }) => safeTool("Block added", () => client.addBlock({ content, block_type, position })));
    server.tool("cerulean_update_block", "Edit a block's content directly.", {
        block_id: z.string().uuid(),
        content: z.string(),
    }, async ({ block_id, content }) => safeTool("Block updated", () => client.updateBlock(block_id, content)));
    server.tool("cerulean_remove_block", "Delete a document block.", { block_id: z.string().uuid() }, async ({ block_id }) => safeTool("Block removed", () => client.removeBlock(block_id)));
    server.tool("cerulean_export_document", "Export document as markdown, plain text, or PRD format.", {
        format: z.enum(["markdown", "text", "prd"]).default("markdown"),
    }, async ({ format }) => safeTool("Document exported", () => client.exportDocument(format)));
    // ─── Patches ───
    server.tool("cerulean_get_pending_patch", "See if there's a document change waiting for approval.", {}, async () => safeTool("Pending patch loaded", () => client.getPendingPatch()));
    server.tool("cerulean_create_patch", "Create a custom pending patch (advanced). Use when you've drafted exact document changes.", {
        operations: z.array(z.object({
            type: z.enum(["insert_block", "update_block", "delete_block", "move_block"]),
            block_id: z.string(),
            block: z.record(z.string(), z.unknown()).optional(),
            position: z.number().optional(),
        })),
        source_insight_id: z.string().uuid().optional().nullable(),
        source_text: z.string().optional().nullable(),
    }, async ({ operations, source_insight_id, source_text }) => safeTool("Custom patch created — awaiting accept", () => client.createPatch({
        operations,
        sourceInsightId: source_insight_id,
        sourceText: source_text,
    })));
    server.tool("cerulean_accept_patch", "Apply the pending patch to the document. ONLY call when the user explicitly says to accept/apply.", {}, async () => safeTool("Patch accepted — document updated", () => client.acceptPatch()));
    server.tool("cerulean_reject_patch", "Discard the pending patch.", {}, async () => safeTool("Patch rejected", () => client.rejectPatch()));
    // ─── Graph ───
    server.tool("cerulean_sync_graph", "Rebuild and persist the knowledge graph from insights and document blocks.", {}, async () => safeTool("Graph synced", () => client.syncGraph()));
    server.tool("cerulean_get_graph", "Get knowledge graph nodes and edges.", {}, async () => safeTool("Graph loaded", () => client.getGraph()));
    server.tool("cerulean_add_graph_node", "Add a node to the knowledge graph.", {
        node_type: z.enum(["message", "insight", "document_block", "topic"]),
        entity_id: z.string().uuid(),
        label: z.string(),
    }, async ({ node_type, entity_id, label }) => safeTool("Graph node added", () => client.addGraphNode(node_type, entity_id, label)));
    server.tool("cerulean_add_graph_edge", "Connect two graph nodes with a relationship.", {
        source_node_id: z.string().uuid(),
        target_node_id: z.string().uuid(),
        relationship_type: z.enum([
            "supports",
            "contradicts",
            "expands",
            "references",
            "derived_from",
        ]),
    }, async ({ source_node_id, target_node_id, relationship_type }) => safeTool("Graph edge added", () => client.addGraphEdge(source_node_id, target_node_id, relationship_type)));
    // ─── Exemplars ───
    server.tool("cerulean_list_exemplars", "List exemplar documents.", {}, async () => safeTool("Exemplars listed", () => client.listExemplars()));
    server.tool("cerulean_add_exemplar", "Upload an exemplar document with quality notes.", {
        title: z.string(),
        markdown: z.string(),
        user_notes: z.string().default(""),
    }, async ({ title, markdown, user_notes }) => safeTool("Exemplar added", () => client.addExemplar(title, markdown, user_notes)));
    server.tool("cerulean_remove_exemplar", "Delete an exemplar.", { exemplar_id: z.string().uuid() }, async ({ exemplar_id }) => safeTool("Exemplar removed", () => client.removeExemplar(exemplar_id)));
    // ─── Settings & AI ───
    server.tool("cerulean_get_settings", "Get background agent toggles.", {}, async () => safeTool("Settings loaded", () => client.getSettings()));
    server.tool("cerulean_update_settings", "Toggle background agents (knowledge graph, ranking, suggestions, tonal adjustment).", {
        knowledge_graph: z.boolean().optional(),
        ranking: z.boolean().optional(),
        suggestion: z.boolean().optional(),
        tonal_adjustment: z.boolean().optional(),
    }, async (toggles) => safeTool("Settings updated", () => client.updateSettings({
        backgroundAgents: {
            knowledgeGraph: toggles.knowledge_graph,
            ranking: toggles.ranking,
            suggestion: toggles.suggestion,
            tonalAdjustment: toggles.tonal_adjustment,
        },
    })));
    server.tool("cerulean_run_ai_action", "Run server-side Cerulean AI (document expand, etc.). Needs API keys on server OR dev mode.", {
        action: z.record(z.string(), z.unknown()),
    }, async ({ action }) => safeTool("AI action complete", () => client.runAiAction(action)));
}
