import { AgentDefinition, AgentResult } from "../types";
import { InsightExtractAction, InsightExtractResult } from "../actions";
import { agentRegistry } from "../registry";
import { extractInsightsFromText } from "../dev-ai";

type ExtractInput = InsightExtractAction["input"];

const insightExtractionAgent: AgentDefinition<ExtractInput, InsightExtractResult> = {
  id: "insight_extraction",
  name: "Insight Extraction Agent",
  description:
    "Ingests documents and text to extract supporting ideas, contradictions, and new insights.",
  systemPrompt: `You are an insight extraction specialist inside Cerulean, a structured thinking workspace.

When given imported text (documents, PDFs, notes), you extract discrete, meaningful insights:
- **Supporting ideas**: Claims, evidence, or arguments that reinforce existing thinking.
- **New perspectives**: Novel angles or frameworks not yet present in the workspace.
- **Contradictions**: Points that challenge or conflict with existing insights.

Guidelines:
- Each extracted insight should be self-contained — understandable without the source document.
- Prefer quality over quantity. Extract only insights that add genuine value.
- Title each insight with a clear, descriptive phrase (not a sentence fragment).
- Preserve the source's meaning accurately. Do not editorialize or inject opinions.
- Skip purely formatting content, boilerplate, or metadata.`,

  async run(
    input: ExtractInput
  ): Promise<AgentResult<InsightExtractResult>> {
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
