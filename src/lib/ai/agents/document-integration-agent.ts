import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { DocumentPromoteAction, DocumentPromoteResult } from "../actions";
import { agentRegistry } from "../registry";
import { DocumentBlock, DocumentType } from "@/types";
import { callAIForJSON } from "../call-ai";
import { buildPromotionPatch } from "@/lib/document/placement";
import { classifyPromotionSection } from "@/lib/document/classify-section";
import { DEFAULT_DOCUMENT_TYPE } from "@/lib/document-templates/registry";

type PromoteInput = DocumentPromoteAction["input"];

const SYSTEM_PROMPT = `You are a document integration specialist inside Cerulean, a structured thinking workspace.

When text or an insight is promoted to the document, your job is to:
1. Determine the best target section for placement
2. Adapt tone and phrasing to match the existing document's voice

Return JSON: { "target_section": "Section Name", "adapted_text": "..." }
- target_section must match an existing heading in the document when possible
- adapted_text preserves meaning; only adjust tone for consistency`;

const documentIntegrationAgent: AgentDefinition<PromoteInput, DocumentPromoteResult> = {
  id: "document_integration",
  name: "Document Integration Agent",
  description:
    "Integrates promoted text and insights into the structured document. Determines optimal placement and adapts tone.",
  systemPrompt: SYSTEM_PROMPT,

  async run(input: PromoteInput, context: AgentContext): Promise<AgentResult<DocumentPromoteResult>> {
    const documentType = (input.documentType ?? DEFAULT_DOCUMENT_TYPE) as DocumentType;
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
    let targetSection = input.targetSection;

    if (existingBlocks.length > 0) {
      const documentSnapshot = existingBlocks
        .sort((a, b) => a.position - b.position)
        .map((b) => `[${b.block_type}] ${b.content}`)
        .join("\n");

      const aiResult = await callAIForJSON<{
        target_section?: string;
        adapted_text?: string;
      }>({
        systemPrompt: SYSTEM_PROMPT,
        userMessage: `Document type: ${documentType}\n\nExisting document:\n${documentSnapshot}\n\nText to integrate:\n${input.text}`,
        fallback: {},
      });

      if (aiResult.adapted_text) textToIntegrate = aiResult.adapted_text;
      if (aiResult.target_section) targetSection = aiResult.target_section;
    }

    if (!targetSection) {
      targetSection = classifyPromotionSection(textToIntegrate, documentType);
    }

    const { operations, placement_label, placement_block_id } = buildPromotionPatch({
      text: textToIntegrate,
      blocks: existingBlocks,
      documentType,
      insightId: input.insightId,
      sourceMessageIds: input.sourceMessageIds,
      targetSection,
    });

    return {
      agentId: "document_integration",
      success: true,
      data: { operations, placement_label, placement_block_id },
    };
  },
};

agentRegistry.register(documentIntegrationAgent);

export default documentIntegrationAgent;
