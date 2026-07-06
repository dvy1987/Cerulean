import type { DocumentBlock, DocumentType } from "@/types";
import { callAIForJSON } from "@/lib/ai/call-ai";
import { resolveProviderConfig } from "@/lib/ai/provider";
import {
  classifyPromotionSectionWithConfidence,
  PlacementConfidence,
} from "@/lib/document/classify-section";
import { headingsMatch } from "@/lib/document/heading-match";
import { getSectionHeadings } from "@/lib/document-templates/registry";

export type PlacementSource = "llm" | "heuristic";

export interface ResolvedPlacement {
  targetSection: string;
  confidence: PlacementConfidence;
  source: PlacementSource;
  adaptedText?: string;
}

const PLACEMENT_PROMPT = `You classify promoted text into exactly one document section.

Return JSON: { "target_section": "Section Name", "confidence": "high"|"medium"|"low", "adapted_text": "optional tone-adjusted text" }
- target_section MUST match one of the provided section headings exactly
- confidence reflects how clearly the text belongs in that section`;

export async function resolvePlacement(opts: {
  text: string;
  documentType: DocumentType;
  blocks: DocumentBlock[];
  smartPlacement: boolean;
  providerConfig?: ReturnType<typeof resolveProviderConfig>;
}): Promise<ResolvedPlacement> {
  const { text, documentType, blocks, smartPlacement } = opts;
  const trimmed = text.trim();
  const sections = getSectionHeadings(documentType);

  if (trimmed.length < 20) {
    const h = classifyPromotionSectionWithConfidence(trimmed, documentType);
    return {
      targetSection: h.targetSection,
      confidence: "low",
      source: "heuristic",
    };
  }

  const config =
    opts.providerConfig ??
    resolveProviderConfig();

  const canUseLlm =
    smartPlacement && config.provider !== "dev" && sections.length > 0;

  if (canUseLlm) {
    const snapshot =
      blocks.length > 0
        ? blocks
            .sort((a, b) => a.position - b.position)
            .map((b) => `[${b.block_type}] ${b.content}`)
            .join("\n")
        : "(empty)";

    const aiResult = await callAIForJSON<{
      target_section?: string;
      confidence?: PlacementConfidence;
      adapted_text?: string;
    }>({
      systemPrompt: PLACEMENT_PROMPT,
      userMessage: `Document type: ${documentType}\nSections: ${sections.join(", ")}\n\nDocument:\n${snapshot}\n\nText to place:\n${trimmed}`,
      fallback: {},
    });

    if (aiResult.target_section) {
      const matched =
        sections.find((s) => headingsMatch(s, aiResult.target_section!)) ??
        aiResult.target_section;
      const confidence =
        aiResult.confidence === "high" ||
        aiResult.confidence === "medium" ||
        aiResult.confidence === "low"
          ? aiResult.confidence
          : "medium";

      return {
        targetSection: matched,
        confidence,
        source: "llm",
        adaptedText: aiResult.adapted_text,
      };
    }
  }

  const heuristic = classifyPromotionSectionWithConfidence(trimmed, documentType);
  return {
    targetSection: heuristic.targetSection,
    confidence: heuristic.confidence,
    source: "heuristic",
  };
}
