import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { SuggestionResult } from "../actions";
import { agentRegistry } from "../registry";
import { detectContradictions, generateThinkingSuggestions } from "../dev-ai";
import { callAIForJSON } from "../call-ai";

const SYSTEM_PROMPT = `You are the Suggestion Agent inside Cerulean, a structured thinking workspace.

Your job is to analyze the current conversation, unresolved insights, document gaps, and contradictions to produce actionable next-step suggestions. Each suggestion should prompt the user to deepen their thinking, resolve a tension, or move their document forward.

Suggestion sources:
- "unresolved_insight": tied to a specific unresolved insight
- "document_gap": document is empty or missing key sections
- "contradiction": two insights conflict
- "context": general thinking prompt based on conversation

Return a JSON array of 2-4 suggestions. Each object: {"text": string, "source": string, "source_entity_id"?: string}`;

const suggestionAgent: AgentDefinition<Record<string, never>, SuggestionResult> = {
  id: "suggestion",
  name: "Suggestion Agent",
  description:
    "Analyzes conversation, unresolved insights, document gaps, and contradictions to suggest both insights and next-topic prompts.",
  systemPrompt: SYSTEM_PROMPT,

  async run(_input: Record<string, never>, context: AgentContext): Promise<AgentResult<SuggestionResult>> {
    const { insights, blocks, messages } = context.stores;

    const unresolvedInsights = insights
      .filter((i) => i.status === "captured" || i.status === "discussing")
      .slice(0, 5);

    const recentMessages = messages.slice(-5).map((m) => `${m.role}: ${m.content}`).join("\n");

    const contextSummary = [
      `Recent conversation:\n${recentMessages || "None yet"}`,
      `Unresolved insights (${unresolvedInsights.length}): ${unresolvedInsights.map((i) => `"${i.title}"`).join(", ") || "None"}`,
      `Document blocks: ${blocks.length}`,
    ].join("\n\n");

    const aiSuggestions = await callAIForJSON<SuggestionResult["suggestions"]>({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: `Workspace state:\n${contextSummary}\n\nGenerate 2-4 actionable suggestions.`,
      fallback: [],
    });

    if (aiSuggestions.length > 0) {
      return {
        agentId: "suggestion",
        success: true,
        data: { suggestions: aiSuggestions.slice(0, 4) },
      };
    }

    const contradictions = detectContradictions(
      insights.map((i) => ({ insight_id: i.insight_id, content: i.content }))
    );

    const suggestions = generateThinkingSuggestions(
      unresolvedInsights.map((i) => ({ insight_id: i.insight_id, title: i.title })),
      blocks.length,
      contradictions.length > 0
    );

    return {
      agentId: "suggestion",
      success: true,
      data: { suggestions },
    };
  },
};

agentRegistry.register(suggestionAgent);

export default suggestionAgent;
