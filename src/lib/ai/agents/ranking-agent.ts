import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { RankingResult } from "../actions";
import { agentRegistry } from "../registry";
import { computeRelevanceScores } from "../dev-ai";

const rankingAgent: AgentDefinition<Record<string, never>, RankingResult> = {
  id: "ranking",
  name: "Insight Relevance Ranking Agent",
  description:
    "Ranks tray insights by relevance to current document state. Re-ranks as the document evolves.",
  systemPrompt: `You are the Insight Relevance Ranking Agent. Given the current document content 
and all insights, score each insight by how relevant it is to the document right now. 
Higher scores mean the insight is more useful for the document's current direction. 
Consider word overlap, thematic alignment, and recency.`,

  async run(
    _input: Record<string, never>,
    context: AgentContext
  ): Promise<AgentResult<RankingResult>> {
    const { insights, blocks } = context.stores;

    // Build full document text from blocks
    const documentText = blocks
      .sort((a, b) => a.position - b.position)
      .map((b) => b.content)
      .join("\n");

    // Compute scores using existing dev-ai logic
    const scoreMap = computeRelevanceScores(
      insights.map((i) => ({
        insight_id: i.insight_id,
        content: i.content,
        created_at: i.created_at,
      })),
      documentText
    );

    // Convert Map to Record for the result type
    const scores: Record<string, number> = {};
    scoreMap.forEach((score, id) => {
      scores[id] = score;
    });

    return {
      agentId: "ranking",
      success: true,
      data: { scores },
    };
  },
};

agentRegistry.register(rankingAgent);

export default rankingAgent;
