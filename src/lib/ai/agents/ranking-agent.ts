import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { RankingResult } from "../actions";
import { agentRegistry } from "../registry";

const rankingAgent: AgentDefinition<Record<string, never>, RankingResult> = {
  id: "ranking",
  name: "Insight Relevance Ranking Agent",
  description:
    "Ranks tray insights by relevance and maturity. Re-ranks as the document evolves.",
  systemPrompt: `You are the Insight Relevance Ranking Agent. Given the current document content
and all insights, score each insight on two dimensions: relevance (0-10, how applicable to the
current document) and maturity (0-10, how developed or resolved the insight is).
Consider word overlap, thematic alignment, recency, and discussion status.`,

  async run(
    _input: Record<string, never>,
    context: AgentContext
  ): Promise<AgentResult<RankingResult>> {
    const { insights, blocks, messages } = context.stores;

    const documentText = blocks
      .sort((a, b) => a.position - b.position)
      .map((b) => b.content)
      .join("\n");

    const recentChat = messages.slice(-20).map((m) => m.content).join(" ");

    const scores: Record<string, { relevance: number; maturity: number }> = {};

    const activeInsights = insights.filter((i) => i.status !== "archived");

    for (const insight of activeInsights) {
      const relevance = computeRelevance(insight.content, documentText, insight.created_at);
      const maturity = computeMaturity(insight.status, insight.content, recentChat);

      scores[insight.insight_id] = { relevance, maturity };
    }

    return {
      agentId: "ranking",
      success: true,
      data: { scores },
    };
  },
};

function computeRelevance(
  insightContent: string,
  documentText: string,
  createdAt: string
): number {
  if (!documentText.trim()) return 0;

  const insightWords = insightContent.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const docWordSet = new Set(documentText.toLowerCase().split(/\W+/).filter((w) => w.length > 3));

  if (insightWords.length === 0 || docWordSet.size === 0) return 1;

  const matches = insightWords.filter((w) => docWordSet.has(w)).length;
  const overlap = (matches / insightWords.length) * 8;

  const age = Date.now() - new Date(createdAt).getTime();
  const recencyBoost = Math.max(0, 2 - (age / (1000 * 60 * 60 * 24 * 7)) * 2);

  return Math.min(10, Math.max(1, Math.round((overlap + recencyBoost) * 10) / 10));
}

function computeMaturity(
  status: string,
  insightContent: string,
  recentChat: string
): number {
  let maturity = 0;

  if (status === "discussing") {
    maturity += 3;
  } else if (status === "resolved") {
    maturity += 5;
  } else if (status === "promoted") {
    maturity += 7;
  }

  const insightWords = insightContent.toLowerCase().split(/\s+/);
  const chatLines = recentChat.toLowerCase().split(/\s+/);
  const chatSet = new Set(chatLines);

  const chatMatches = insightWords.filter((w) => chatSet.has(w)).length;
  maturity += Math.min(chatMatches, 10 - maturity);

  return Math.min(10, Math.max(0, maturity));
}

agentRegistry.register(rankingAgent);

export default rankingAgent;
