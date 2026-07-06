import { runAiAction } from "./orchestrator";
import { AgentContext, AiSettingsSnapshot } from "./types";
import {
  ContradictionResult,
  InsightProposeResult,
  RankingResult,
  SuggestionResult,
} from "./actions";
import { Contradiction, ThinkingSuggestion, ProposedInsight } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { WorkspaceService } from "@/lib/db/workspace-service";
import {
  MAX_PROPOSALS,
  MIN_ASSISTANT_MESSAGE_LENGTH,
} from "@/lib/insights/proposal-constants";

export interface PostChatPipelineInput {
  userId?: string;
  context: AgentContext;
  assistantMessageId: string;
  userMessage: string;
  assistantMessage: string;
  settings: AiSettingsSnapshot & { suggestInsights?: boolean };
}

export interface PostChatPipelineResult {
  proposals: ProposedInsight[];
  suggestions: ThinkingSuggestion[];
  contradictions: Contradiction[];
  insightScores: Record<string, { relevance: number; maturity: number }>;
}

function normalizeForDedup(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isDuplicateProposal(
  proposal: { title: string; content: string },
  insights: Array<{ title: string; content: string }>
): boolean {
  const pContent = normalizeForDedup(proposal.content);
  const pTitle = normalizeForDedup(proposal.title);

  return insights.some((insight) => {
    const iContent = normalizeForDedup(insight.content);
    const iTitle = normalizeForDedup(insight.title);
    if (!pContent && !pTitle) return true;
    if (pContent && pContent === iContent) return true;
    if (pTitle && pTitle === iTitle) return true;
    if (pContent.length > 24 && iContent.includes(pContent.slice(0, 40))) return true;
    if (iContent.length > 24 && pContent.includes(iContent.slice(0, 40))) return true;
    return false;
  });
}

export async function runPostChatPipeline(
  opts: PostChatPipelineInput
): Promise<PostChatPipelineResult> {
  const {
    userId,
    context,
    assistantMessageId,
    userMessage,
    assistantMessage,
    settings,
  } = opts;

  const suggestInsights = settings.suggestInsights !== false;
  const bg = settings.backgroundAgents;
  const existingInsights = context.stores.insights;

  const assistantLongEnough =
    assistantMessage.trim().length >= MIN_ASSISTANT_MESSAGE_LENGTH;

  const proposePromise =
    suggestInsights && assistantLongEnough
      ? runAiAction<InsightProposeResult>(
          {
            type: "insight.propose",
            input: { userMessage, assistantMessage, assistantMessageId },
          },
          { context, userId }
        )
      : Promise.resolve(null);

  const suggestionPromise = bg.suggestion
    ? runAiAction<SuggestionResult>(
        { type: "suggestion.generate", input: {} },
        { context, userId }
      )
    : Promise.resolve(null);

  const rankingPromise = bg.ranking
    ? runAiAction<RankingResult>(
        { type: "ranking.score", input: {} },
        { context, userId }
      )
    : Promise.resolve(null);

  const graphPromise = bg.knowledgeGraph
    ? runAiAction(
        {
          type: "graph.update",
          input: {
            trigger: "message_added",
            entityId: assistantMessageId,
            entityType: "message",
          },
        },
        { context, userId }
      )
    : Promise.resolve(null);

  const contradictionPromise =
    existingInsights.length >= 2
      ? runAiAction<ContradictionResult>(
          { type: "insight.detect_contradictions", input: {} },
          { context, userId }
        )
      : Promise.resolve(null);

  const [proposeRes, suggestionRes, rankingRes, , contradictionRes] =
    await Promise.allSettled([
      proposePromise,
      suggestionPromise,
      rankingPromise,
      graphPromise,
      contradictionPromise,
    ]);

  let proposals: ProposedInsight[] = [];
  if (
    proposeRes.status === "fulfilled" &&
    proposeRes.value &&
    "success" in proposeRes.value &&
    proposeRes.value.success
  ) {
    proposals = proposeRes.value.data.proposals
      .filter((p) => !isDuplicateProposal(p, existingInsights))
      .slice(0, MAX_PROPOSALS)
      .map((p) => ({
        proposal_id: uuidv4(),
        title: p.title,
        content: p.content,
        assistant_message_id: assistantMessageId,
        confidence: p.confidence,
      }));
  }

  let suggestions: ThinkingSuggestion[] = [];
  if (
    suggestionRes.status === "fulfilled" &&
    suggestionRes.value &&
    "success" in suggestionRes.value &&
    suggestionRes.value.success
  ) {
    suggestions = suggestionRes.value.data.suggestions.map((s) => ({
      suggestion_id: uuidv4(),
      text: s.text,
      source: s.source,
      source_entity_id: s.source_entity_id,
    }));
  }

  let insightScores: Record<string, { relevance: number; maturity: number }> = {};
  if (
    rankingRes.status === "fulfilled" &&
    rankingRes.value &&
    "success" in rankingRes.value &&
    rankingRes.value.success
  ) {
    insightScores = rankingRes.value.data.scores;
    if (userId) {
      const service = new WorkspaceService(userId);
      for (const [insightId, s] of Object.entries(insightScores)) {
        await service
          .updateInsight(insightId, {
            relevance: s.relevance,
            maturity: s.maturity,
          })
          .catch(() => {});
      }
    }
  }

  let contradictions: Contradiction[] = [];
  if (
    contradictionRes.status === "fulfilled" &&
    contradictionRes.value &&
    "success" in contradictionRes.value &&
    contradictionRes.value.success
  ) {
    const data = contradictionRes.value.data as ContradictionResult;
    contradictions = data.contradictions.map((c) => ({
      contradiction_id: uuidv4(),
      insight_a_id: c.insight_a_id,
      insight_b_id: c.insight_b_id,
      description: c.description,
      detected_at: new Date().toISOString(),
    }));
  }

  return { proposals, suggestions, contradictions, insightScores };
}
