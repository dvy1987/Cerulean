// Development AI module
// Simulates intelligent responses without requiring external API keys.
// External providers (OpenAI, Anthropic, etc.) will be integrated later.

import { DocumentBlock, PatchOperation } from "@/types";
import { v4 as uuidv4 } from "uuid";

const THINKING_DELAY = 600;
const CHAR_DELAY = 15;

// Simulated chat responses based on conversation context
const RESPONSE_TEMPLATES: Record<string, string[]> = {
  default: [
    "That's an interesting point. Let me help you think through this.\n\nThere are a few angles we could explore:\n\n1. **Core assumptions** — What are we taking for granted here?\n2. **User perspective** — How would end users experience this?\n3. **Trade-offs** — What are we giving up with this approach?\n\nWhich direction would you like to go deeper on?",
    "Great question. Let me break this down.\n\nThe key consideration here is understanding the underlying motivation. When we look at this from first principles:\n\n- The primary goal should drive every decision\n- Secondary benefits are nice but shouldn't compromise the core\n- We need to validate assumptions early\n\nWhat specific aspect would you like to explore further?",
    "I think there's a nuanced answer here. Let me share my thinking.\n\nOn one hand, the straightforward approach has clear advantages — simplicity, speed of implementation, and easy iteration. On the other hand, investing in a more robust solution now could save significant effort later.\n\nThe right choice likely depends on your timeline and risk tolerance. What constraints are you working with?",
  ],
  strategy: [
    "From a strategic perspective, there are three key dimensions to consider:\n\n**Market positioning**: Where does this fit relative to existing solutions?\n\n**Competitive advantage**: What's the defensible moat here?\n\n**Timing**: Is the market ready for this approach?\n\nI'd recommend starting with the positioning question, as it tends to inform the others. What are your thoughts?",
  ],
  product: [
    "For this product decision, let's think about the user journey:\n\n1. **Discovery** — How do users first encounter this?\n2. **Activation** — What's the \"aha moment\"?\n3. **Retention** — What brings them back?\n4. **Expansion** — How does usage grow?\n\nEach stage has different requirements. Which stage feels most critical right now?",
  ],
};

function pickResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("strategy") || lower.includes("competitive") || lower.includes("market")) {
    return RESPONSE_TEMPLATES.strategy[0];
  }
  if (lower.includes("product") || lower.includes("user") || lower.includes("feature")) {
    return RESPONSE_TEMPLATES.product[0];
  }
  const defaults = RESPONSE_TEMPLATES.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
}

/**
 * Stream a simulated chat response character by character.
 */
export async function streamChatResponse(
  userMessage: string,
  onChunk: (text: string) => void,
  onComplete: () => void
): Promise<void> {
  const response = pickResponse(userMessage);

  // Simulate thinking delay
  await new Promise((resolve) => setTimeout(resolve, THINKING_DELAY));

  // Stream character by character
  for (let i = 0; i < response.length; i++) {
    onChunk(response[i]);
    // Vary speed slightly for natural feel
    const delay = response[i] === "\n" ? CHAR_DELAY * 3 : CHAR_DELAY;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  onComplete();
}

/**
 * Generate patch operations to integrate promoted text into the document.
 * This simulates the AI determining placement and adapting tone.
 */
export function generatePromotionPatch(
  promotedText: string,
  existingBlocks: DocumentBlock[],
  insightId: string | null,
  sourceMessageIds: string[]
): PatchOperation[] {
  const operations: PatchOperation[] = [];
  const newBlockId = uuidv4();

  // If document is empty, create a heading first then add content
  if (existingBlocks.length === 0) {
    const headingId = uuidv4();
    operations.push({
      type: "insert_block",
      block_id: headingId,
      block: {
        content: "Key Ideas",
        block_type: "heading",
        linked_insights: [],
        source_messages: [],
      },
      position: 0,
    });
    operations.push({
      type: "insert_block",
      block_id: newBlockId,
      block: {
        content: promotedText,
        block_type: "paragraph",
        linked_insights: insightId ? [insightId] : [],
        source_messages: sourceMessageIds,
      },
      position: 1,
    });
  } else {
    // Add after the last block
    const lastPosition = Math.max(...existingBlocks.map((b) => b.position));
    operations.push({
      type: "insert_block",
      block_id: newBlockId,
      block: {
        content: promotedText,
        block_type: "paragraph",
        linked_insights: insightId ? [insightId] : [],
        source_messages: sourceMessageIds,
      },
      position: lastPosition + 1,
    });
  }

  return operations;
}

/**
 * Convert an insight into a chat prompt for exploration.
 */
export function insightToPrompt(insightTitle: string, insightContent: string): string {
  return `Let's explore this idea further: "${insightTitle}"\n\n${insightContent}\n\nWhat are the key considerations and trade-offs we should think about?`;
}
