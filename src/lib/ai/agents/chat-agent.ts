import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { ChatRespondAction, ChatRespondResult, InsightToPromptAction, InsightToPromptResult } from "../actions";
import { agentRegistry } from "../registry";
import { streamChatResponse, insightToPrompt } from "../dev-ai";
import {
  resolveProviderConfig,
  ChatMessage,
  ProviderConfig,
  streamProvider,
} from "../provider";

type ChatInput = ChatRespondAction["input"] | InsightToPromptAction["input"];

function isInsightToPromptInput(
  input: ChatInput
): input is InsightToPromptAction["input"]
{
  return "insightTitle" in input;
}

export const CHAT_SYSTEM_PROMPT = `You are a conversational thinking partner inside Cerulean, a structured thinking workspace.

Your role is to help the user explore ideas deeply. You ask probing questions, surface hidden assumptions, and encourage the user to examine their thinking from multiple angles.

Guidelines:
- Never rewrite the user's words. Help them refine their own thinking.
- Ask one focused question at a time rather than overwhelming with many.
- When the user shares an idea, reflect it back with added depth — highlight implications, trade-offs, or unstated assumptions.
- Use structured formats (numbered lists, bolded key terms) to make your responses scannable.
- If the user seems stuck, suggest a concrete angle or framework to move forward.
- Keep responses concise. Depth over length.`;

function buildMessages(userMessage: string, context: AgentContext): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: "system", content: CHAT_SYSTEM_PROMPT }];
  const recent = context.stores.messages
    .filter((m) => m.content.length > 0)
    .slice(-20);

  for (const msg of recent) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  const last = recent[recent.length - 1];
  if (!last || last.role !== "user" || last.content !== userMessage) {
    messages.push({ role: "user", content: userMessage });
  }

  return messages;
}

function resolveChatProvider(context: AgentContext): ProviderConfig {
  if (context.providerConfig) return context.providerConfig;
  return resolveProviderConfig();
}

const chatAgent: AgentDefinition<ChatInput, ChatRespondResult | InsightToPromptResult> = {
  id: "chat",
  name: "Chat Agent",
  description:
    "Core conversational AI. Handles chat responses and insight-to-prompt conversion.",
  systemPrompt: CHAT_SYSTEM_PROMPT,

  async run(
    input: ChatInput,
    context: AgentContext,
    options?: { onChunk?: (chunk: string) => void }
  ): Promise<AgentResult<ChatRespondResult | InsightToPromptResult>> {
    if (isInsightToPromptInput(input)) {
      const prompt = insightToPrompt(input.insightTitle, input.insightContent);
      return {
        agentId: "chat",
        success: true,
        data: { prompt } as InsightToPromptResult,
      };
    }

    const { userMessage } = input as ChatRespondAction["input"];
    const config = resolveChatProvider(context);

    if (config.provider !== "dev") {
      try {
        const messages = buildMessages(userMessage, context);
        let full = "";

        if (options?.onChunk) {
          const result = await streamProvider(
            config,
            { messages },
            {
              onChunk: (chunk) => {
                full += chunk;
                options.onChunk?.(chunk);
              },
            }
          );
          full = result.content || full;
        } else {
          const { callProvider } = await import("../provider");
          const result = await callProvider(config, { messages });
          full = result.content;
        }

        return {
          agentId: "chat",
          success: true,
          data: { response: full } as ChatRespondResult,
        };
      } catch (err) {
        console.warn("Chat provider failed, falling back to dev mode:", err);
      }
    }

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
