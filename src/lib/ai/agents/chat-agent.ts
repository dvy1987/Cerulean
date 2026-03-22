import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { ChatRespondAction, ChatRespondResult, InsightToPromptAction, InsightToPromptResult } from "../actions";
import { agentRegistry } from "../registry";
import { streamChatResponse, insightToPrompt } from "../dev-ai";

type ChatInput = ChatRespondAction["input"] | InsightToPromptAction["input"];
type ChatOutput = ChatRespondResult | InsightToPromptResult;

function isInsightToPromptInput(
  input: ChatInput
): input is InsightToPromptAction["input"] {
  return "insightTitle" in input;
}

const SYSTEM_PROMPT = `You are a conversational thinking partner inside Cerulean, a structured thinking workspace.

Your role is to help the user explore ideas deeply. You ask probing questions, surface hidden assumptions, and encourage the user to examine their thinking from multiple angles.

Guidelines:
- Never rewrite the user's words. Help them refine their own thinking.
- Ask one focused question at a time rather than overwhelming with many.
- When the user shares an idea, reflect it back with added depth — highlight implications, trade-offs, or unstated assumptions.
- Use structured formats (numbered lists, bolded key terms) to make your responses scannable.
- If the user seems stuck, suggest a concrete angle or framework to move forward.
- Keep responses concise. Depth over length.`;

/**
 * Try calling the real AI provider via the API route.
 * Returns the response text, or null if running in dev mode.
 */
async function callRealProvider(
  userMessage: string,
  context: AgentContext
): Promise<string | null> {
  try {
    // Build conversation history for context
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Include recent conversation history (last 20 messages)
    const recentMessages = context.stores.messages.slice(-20);
    for (const msg of recentMessages) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    // Add the current user message
    messages.push({ role: "user", content: userMessage });

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      console.warn("AI provider returned error, falling back to dev mode");
      return null;
    }

    const data = await response.json();

    // If server says provider is "dev", return null to use dev-ai
    if (data.provider === "dev") {
      return null;
    }

    return data.content as string;
  } catch {
    console.warn("Failed to reach AI API, falling back to dev mode");
    return null;
  }
}

const chatAgent: AgentDefinition<ChatInput, ChatOutput> = {
  id: "chat",
  name: "Chat Agent",
  description:
    "Core conversational AI. Handles chat responses and insight-to-prompt conversion.",
  systemPrompt: SYSTEM_PROMPT,

  async run(
    input: ChatInput,
    context: AgentContext,
    options?: { onChunk?: (chunk: string) => void }
  ): Promise<AgentResult<ChatOutput>> {
    if (isInsightToPromptInput(input)) {
      const prompt = insightToPrompt(input.insightTitle, input.insightContent);
      return {
        agentId: "chat",
        success: true,
        data: { prompt } as InsightToPromptResult,
      };
    }

    const { userMessage } = input as ChatRespondAction["input"];

    // Try real AI provider first
    const realResponse = await callRealProvider(userMessage, context);

    if (realResponse) {
      // Stream the real response character by character for consistent UX
      let fullResponse = "";
      for (let i = 0; i < realResponse.length; i++) {
        fullResponse += realResponse[i];
        options?.onChunk?.(realResponse[i]);
        // Small delay for natural streaming feel
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      return {
        agentId: "chat",
        success: true,
        data: { response: fullResponse } as ChatRespondResult,
      };
    }

    // Fall back to dev-ai
    let fullResponse = "";
    await streamChatResponse(
      userMessage,
      (chunk) => {
        fullResponse += chunk;
        options?.onChunk?.(chunk);
      },
      () => {}
    );

    return {
      agentId: "chat",
      success: true,
      data: { response: fullResponse } as ChatRespondResult,
    };
  },
};

agentRegistry.register(chatAgent);

export default chatAgent;
