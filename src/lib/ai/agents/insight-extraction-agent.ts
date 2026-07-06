import { AgentDefinition, AgentResult } from "../types";
import {
  InsightExtractAction,
  InsightExtractResult,
  InsightProposeAction,
  InsightProposeResult,
} from "../actions";
import { agentRegistry } from "../registry";
import { extractInsightsFromText, proposeInsightsFromChat } from "../dev-ai";
import { callAIForJSON } from "../call-ai";
import { MIN_ASSISTANT_MESSAGE_LENGTH } from "@/lib/insights/proposal-constants";

type ExtractInput =
  | InsightExtractAction["input"]
  | (InsightProposeAction["input"] & { mode?: "propose" });

function isProposeInput(
  input: ExtractInput
): input is InsightProposeAction["input"] {
  return "assistantMessageId" in input && "assistantMessage" in input;
}

const IMPORT_PROMPT = `You are an insight extraction specialist inside Cerulean, a structured thinking workspace.

When given imported text (documents, PDFs, notes), you extract discrete, meaningful insights:
- **Supporting ideas**: Claims, evidence, or arguments that reinforce existing thinking.
- **New perspectives**: Novel angles or frameworks not yet present in the workspace.
- **Contradictions**: Points that challenge or conflict with existing insights.

Guidelines:
- Each extracted insight should be self-contained — understandable without the source document.
- Prefer quality over quantity. Extract only insights that add genuine value.
- Title each insight with a clear, descriptive phrase (not a sentence fragment).
- Preserve the source's meaning accurately. Do not editorialize or inject opinions.
- Skip purely formatting content, boilerplate, or metadata.`;

const PROPOSE_PROMPT = `You are an insight capture assistant. After a chat exchange, propose 0–3 short insights the user might want to save.

Rules:
- Return JSON: { "proposals": [{ "title": "...", "content": "...", "confidence": 0.0-1.0 }] }
- Max 3 proposals. Prefer 1–2 high-quality ones.
- Each proposal must be a distinct idea worth saving — not a summary of the whole reply.
- Never duplicate obvious restatements of the user message.
- If nothing is worth saving, return { "proposals": [] }`;

const insightExtractionAgent: AgentDefinition<
  ExtractInput,
  InsightExtractResult | InsightProposeResult
> = {
  id: "insight_extraction",
  name: "Insight Extraction Agent",
  description:
    "Ingests documents and text to extract supporting ideas, contradictions, and new insights. Also proposes insights from chat.",
  systemPrompt: IMPORT_PROMPT,

  async run(
    input: ExtractInput
  ): Promise<AgentResult<InsightExtractResult | InsightProposeResult>> {
    if (isProposeInput(input)) {
      if (input.assistantMessage.trim().length < MIN_ASSISTANT_MESSAGE_LENGTH) {
        return {
          agentId: "insight_extraction",
          success: true,
          data: { proposals: [] },
        };
      }

      const aiProposals = await callAIForJSON<
        Array<{ title: string; content: string; confidence?: number }>
      >({
        systemPrompt: PROPOSE_PROMPT,
        userMessage: `User:\n${input.userMessage}\n\nAssistant:\n${input.assistantMessage}\n\nReturn proposals JSON.`,
        fallback: [],
      });

      const proposals =
        aiProposals.length > 0
          ? aiProposals.slice(0, 3)
          : proposeInsightsFromChat(input.userMessage, input.assistantMessage);

      return {
        agentId: "insight_extraction",
        success: true,
        data: { proposals },
      };
    }

    const aiInsights = await callAIForJSON<Array<{ title: string; content: string }>>({
      systemPrompt: IMPORT_PROMPT,
      userMessage: `Extract the most valuable insights from the following text. Return a JSON array of objects with "title" and "content" fields. Extract 3-8 insights maximum.\n\nText:\n${input.text}`,
      fallback: [],
    });

    if (aiInsights.length > 0) {
      return {
        agentId: "insight_extraction",
        success: true,
        data: { insights: aiInsights },
      };
    }

    const insights = extractInsightsFromText(input.text);
    return {
      agentId: "insight_extraction",
      success: true,
      data: { insights },
    };
  },
};

agentRegistry.register(insightExtractionAgent);

export default insightExtractionAgent;
