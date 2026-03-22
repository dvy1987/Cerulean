import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { TonalAdjustAction, TonalAdjustResult } from "../actions";
import { agentRegistry } from "../registry";

const tonalAdjustmentAgent: AgentDefinition<
  TonalAdjustAction["input"],
  TonalAdjustResult
> = {
  id: "tonal_adjustment",
  name: "Tonal Adjustment Agent",
  description:
    "Learns user's voice from examples or direct guidance. Adjusts tone/style while preserving all arguments and substance.",
  systemPrompt: `You are the Tonal Adjustment Agent. Your job is to adjust the tone and style of 
text while preserving every argument, fact, and piece of substance. Never change the meaning. 
In "match_document" mode, make the text sound consistent with the existing document. 
In "user_directed" mode, apply the user's specific tonal guidance. 
Learn from exemplar documents when provided.`,

  async run(
    input: TonalAdjustAction["input"],
    context: AgentContext
  ): Promise<AgentResult<TonalAdjustResult>> {
    const { text, mode, userDirection } = input;

    let adjustedText: string;

    if (mode === "match_document") {
      adjustedText = applyDocumentToneMatch(text, context);
    } else {
      adjustedText = applyUserDirectedTone(text, userDirection);
    }

    return {
      agentId: "tonal_adjustment",
      success: true,
      data: { adjustedText },
    };
  },
};

/**
 * Dev-mode document tone matching.
 * Makes minor style adjustments to simulate matching existing document voice.
 */
function applyDocumentToneMatch(text: string, context: AgentContext): string {
  const { blocks } = context.stores;

  // If no document content yet, return text as-is
  if (blocks.length === 0) {
    return text;
  }

  // Dev-mode: apply lightweight formality adjustments
  let adjusted = text;

  // Add transitional phrasing if the text starts abruptly
  const startsWithLowercase = /^[a-z]/.test(adjusted);
  if (startsWithLowercase) {
    adjusted = adjusted.charAt(0).toUpperCase() + adjusted.slice(1);
  }

  // Slightly formalize by replacing casual connectors
  adjusted = adjusted.replace(/\bBut\b/g, "However,");
  adjusted = adjusted.replace(/\bAlso,?\b/g, "Furthermore,");
  adjusted = adjusted.replace(/\ba lot of\b/g, "significant");

  return adjusted;
}

/**
 * Dev-mode user-directed tone adjustment.
 * Applies simple transformations based on user guidance.
 */
function applyUserDirectedTone(text: string, userDirection?: string): string {
  if (!userDirection) {
    return text;
  }

  const direction = userDirection.toLowerCase();

  // Dev-mode: handle a few common tonal directions
  if (direction.includes("formal") || direction.includes("professional")) {
    let adjusted = text;
    adjusted = adjusted.replace(/\bdon't\b/g, "do not");
    adjusted = adjusted.replace(/\bcan't\b/g, "cannot");
    adjusted = adjusted.replace(/\bwon't\b/g, "will not");
    adjusted = adjusted.replace(/\bit's\b/g, "it is");
    adjusted = adjusted.replace(/\bthat's\b/g, "that is");
    return adjusted;
  }

  if (direction.includes("casual") || direction.includes("conversational")) {
    let adjusted = text;
    adjusted = adjusted.replace(/\bdo not\b/g, "don't");
    adjusted = adjusted.replace(/\bcannot\b/g, "can't");
    adjusted = adjusted.replace(/\bwill not\b/g, "won't");
    adjusted = adjusted.replace(/\bHowever,?\b/g, "But");
    adjusted = adjusted.replace(/\bFurthermore,?\b/g, "Also,");
    return adjusted;
  }

  if (direction.includes("concise") || direction.includes("brief")) {
    // Remove filler phrases
    let adjusted = text;
    adjusted = adjusted.replace(/\bIn order to\b/g, "To");
    adjusted = adjusted.replace(/\bIt is important to note that\b/g, "");
    adjusted = adjusted.replace(/\bAs a matter of fact,?\b/g, "");
    adjusted = adjusted.replace(/\bAt the end of the day,?\b/g, "");
    return adjusted.replace(/\s{2,}/g, " ").trim();
  }

  // Default: return unchanged with a dev-mode note
  return `[Tone: ${userDirection}] ${text}`;
}

agentRegistry.register(tonalAdjustmentAgent);

export default tonalAdjustmentAgent;
