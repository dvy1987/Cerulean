import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { DocumentPromoteAction, DocumentPromoteResult } from "../actions";
import { agentRegistry } from "../registry";
import { generatePromotionPatch } from "../dev-ai";
import { DocumentBlock } from "@/types";

type PromoteInput = DocumentPromoteAction["input"];

const documentIntegrationAgent: AgentDefinition<PromoteInput, DocumentPromoteResult> = {
  id: "document_integration",
  name: "Document Integration Agent",
  description:
    "Integrates promoted text and insights into the structured document. Determines optimal placement and adapts tone.",
  systemPrompt: `You are a document integration specialist inside Cerulean, a structured thinking workspace.

When text or an insight is promoted to the document, you determine:
1. The best section and position for the new content based on the document's existing structure and flow.
2. How to adapt the promoted text's tone to match the surrounding document.
3. The minimal set of patch operations needed — never rewrite the full document.

Guidelines:
- Make surgical, minimal edits. Insert new blocks rather than rewriting existing ones.
- Preserve the user's original meaning. Adjust phrasing for consistency, not substance.
- If the document is empty, create a sensible starting structure (heading + content).
- Link insights and source messages to new blocks for traceability.`,

  async run(
    input: PromoteInput,
    context: AgentContext
  ): Promise<AgentResult<DocumentPromoteResult>> {
    const existingBlocks: DocumentBlock[] = context.stores.blocks.map(
      (b, i) => ({
        block_id: b.block_id,
        document_id: context.documentId,
        content: b.content,
        block_type: b.block_type as DocumentBlock["block_type"],
        position: b.position ?? i,
        linked_insights: b.linked_insights,
        source_messages: b.source_messages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );

    const operations = generatePromotionPatch(
      input.text,
      existingBlocks,
      input.insightId,
      input.sourceMessageIds
    );

    return {
      agentId: "document_integration",
      success: true,
      data: { operations },
    };
  },
};

agentRegistry.register(documentIntegrationAgent);

export default documentIntegrationAgent;
