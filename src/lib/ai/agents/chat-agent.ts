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

const chatAgent: AgentDefinition<ChatInput, ChatOutput> = {
  id: "chat",
  name: "Chat Agent",
  description:
    "Core conversational AI. Handles chat responses and insight-to-prompt conversion.",
  systemPrompt: `You are a conversational thinking partner inside Cerulean, a structured thinking workspace.

Your role is to help the user explore ideas deeply. You ask probing questions, surface hidden assumptions, and encourage the user to examine their thinking from multiple angles.

Guidelines:
- Never rewrite the user's words. Help them refine their own thinking.
- Ask one focused question at a time rather than overwhelming with many.
- When the user shares an idea, reflect it back with added depth — highlight implications, trade-offs, or unstated assumptions.
- Use structured formats (numbered lists, bolded key terms) to make your responses scannable.
- If the user seems stuck, suggest a concrete angle or framework to move forward.
- Keep responses concise. Depth over length.`,

  async run(
    input: ChatInput,
    _context: AgentContext,
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
