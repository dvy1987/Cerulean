import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { TonalAdjustAction, TonalAdjustResult } from "../actions";
import { agentRegistry } from "../registry";
import { callAI } from "../call-ai";

const SYSTEM_PROMPT = `You are the Tonal Adjustment Agent inside Cerulean, a structured thinking workspace.

Your job is to adjust the tone and style of text while preserving every argument, fact, and piece of substance. Never change the meaning. Return ONLY the adjusted text — no explanations, no labels.

Modes:
- "match_document": Make the text sound consistent with the existing document's voice and style.
- "user_directed": Apply the user's specific tonal guidance exactly.`;

function devAdjust(text: string, mode: string, userDirection?: string, context?: AgentContext): string {
  if (mode === "match_document") {
    let adjusted = text;
    if (/^[a-z]/.test(adjusted)) {
      adjusted = adjusted.charAt(0).toUpperCase() + adjusted.slice(1);
    }
    adjusted = adjusted.replace(/\bBut\b/g, "However,").replace(/\bAlso,?\b/g, "Furthermore,").replace(/\ba lot of\b/g, "significant");
    const hasBlocks = (context?.stores.blocks.length ?? 0) > 0;
    return hasBlocks ? adjusted : text;
  }

  if (!userDirection) return text;
  const dir = userDirection.toLowerCase();

  if (dir.includes("formal") || dir.includes("professional")) {
    return text
      .replace(/\bdon't\b/g, "do not").replace(/\bcan't\b/g, "cannot")
      .replace(/\bwon't\b/g, "will not").replace(/\bit's\b/g, "it is")
      .replace(/\bthat's\b/g, "that is");
  }
  if (dir.includes("casual") || dir.includes("conversational")) {
    return text
      .replace(/\bdo not\b/g, "don't").replace(/\bcannot\b/g, "can't")
      .replace(/\bwill not\b/g, "won't").replace(/\bHowever,?\b/g, "But")
      .replace(/\bFurthermore,?\b/g, "Also,");
  }
  if (dir.includes("concise") || dir.includes("brief")) {
    return text
      .replace(/\bIn order to\b/g, "To")
      .replace(/\bIt is important to note that\b/g, "")
      .replace(/\bAs a matter of fact,?\b/g, "")
      .replace(/\bAt the end of the day,?\b/g, "")
      .replace(/\s{2,}/g, " ").trim();
  }
  return `[Tone: ${userDirection}] ${text}`;
}

const tonalAdjustmentAgent: AgentDefinition<TonalAdjustAction["input"], TonalAdjustResult> = {
  id: "tonal_adjustment",
  name: "Tonal Adjustment Agent",
  description:
    "Learns user's voice from examples or direct guidance. Adjusts tone/style while preserving all arguments and substance.",
  systemPrompt: SYSTEM_PROMPT,

  async run(input: TonalAdjustAction["input"], context: AgentContext): Promise<AgentResult<TonalAdjustResult>> {
    const { text, mode, userDirection } = input;

    const documentSnapshot =
      context.stores.blocks.length > 0
        ? context.stores.blocks
            .sort((a, b) => a.position - b.position)
            .map((b) => b.content)
            .slice(0, 3)
            .join("\n\n")
        : null;

    const userMessage =
      mode === "match_document"
        ? `${documentSnapshot ? `Existing document (for voice reference):\n${documentSnapshot}\n\n` : ""}Text to adjust:\n${text}`
        : `Tonal direction: ${userDirection}\n\nText to adjust:\n${text}`;

    const adjusted = await callAI({ systemPrompt: SYSTEM_PROMPT, userMessage });

    return {
      agentId: "tonal_adjustment",
      success: true,
      data: { adjustedText: adjusted ?? devAdjust(text, mode, userDirection, context) },
    };
  },
};

agentRegistry.register(tonalAdjustmentAgent);

export default tonalAdjustmentAgent;
