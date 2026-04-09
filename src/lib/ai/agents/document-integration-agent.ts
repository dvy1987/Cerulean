import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { DocumentPromoteAction, DocumentPromoteResult } from "../actions";
import { agentRegistry } from "../registry";
import { generatePromotionPatch } from "../dev-ai";
import { DocumentBlock } from "@/types";
import { callAI } from "../call-ai";

type PromoteInput = DocumentPromoteAction["input"];

const SYSTEM_PROMPT = `You are a document integration specialist inside Cerulean, a structured thinking workspace.

When text or an insight is promoted to the document, your job is to adapt its tone and phrasing to match the existing document's voice. You receive the existing document content and the text to integrate.

Guidelines:
- Preserve the user's original meaning completely. Only adjust tone and phrasing for consistency.
- If the document is empty, lightly polish the text for clarity.
- Return ONLY the adapted text — nothing else.`;

const documentIntegrationAgent: AgentDefinition<PromoteInput, DocumentPromoteResult> = {
  id: "document_integration",
  name: "Document Integration Agent",
  description:
    "Integrates promoted text and insights into the structured document. Determines optimal placement and adapts tone.",
  systemPrompt: SYSTEM_PROMPT,

  async run(input: PromoteInput, context: AgentContext): Promise<AgentResult<DocumentPromoteResult>> {
    const existingBlocks: DocumentBlock[] = context.stores.blocks.map((b, i) => ({
      block_id: b.block_id,
      document_id: context.documentId,
      content: b.content,
      block_type: b.block_type as DocumentBlock["block_type"],
      position: b.position ?? i,
      linked_insights: b.linked_insights,
      source_messages: b.source_messages,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    let textToIntegrate = input.text;

    if (existingBlocks.length > 0) {
      const documentSnapshot = existingBlocks
        .sort((a, b) => a.position - b.position)
        .map((b) => b.content)
        .join("\n\n");

      const adapted = await callAI({
        systemPrompt: SYSTEM_PROMPT,
        userMessage: `Existing document:\n${documentSnapshot}\n\nText to integrate:\n${input.text}`,
      });

      if (adapted) {
        textToIntegrate = adapted;
      }
    }

    const operations = generatePromotionPatch(
      textToIntegrate,
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
