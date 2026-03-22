import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { SuggestionResult } from "../actions";
import { agentRegistry } from "../registry";
import { detectContradictions, generateThinkingSuggestions } from "../dev-ai";

const suggestionAgent: AgentDefinition<Record<string, never>, SuggestionResult> = {
  id: "suggestion",
  name: "Suggestion Agent",
  description:
    "Analyzes conversation, unresolved insights, document gaps, and contradictions to suggest both insights and next-topic prompts.",
  systemPrompt: `You are the Suggestion Agent. Your job is to analyze the current conversation, 
unresolved insights, document gaps, and contradictions to produce actionable suggestions. 
Suggest both new insights worth capturing and next-topic prompts to deepen thinking. 
Prioritize suggestions that move the document forward or resolve open tensions.`,

  async run(
    _input: Record<string, never>,
    context: AgentContext
  ): Promise<AgentResult<SuggestionResult>> {
    const { insights, blocks } = context.stores;

    // Filter to unresolved insights (captured or discussing)
    const unresolvedInsights = insights
      .filter((i) => i.status === "captured" || i.status === "discussing")
      .map((i) => ({
        insight_id: i.insight_id,
        title: i.title,
        content: i.content,
      }));

    // Detect contradictions using existing dev-ai logic
    const contradictions = detectContradictions(
      insights.map((i) => ({ insight_id: i.insight_id, content: i.content }))
    );

    // Generate suggestions using existing dev-ai logic
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
