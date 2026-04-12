# Speclet: LLM-Scored Relevance and Maturity

Status: Approved
Date: 2026-04-12

## Problem

The Insight Tray currently ranks insights using a simple keyword-overlap + recency heuristic (`computeRelevanceScores` in `dev-ai.ts`). This produces shallow rankings that cannot judge whether an insight is thematically aligned with the document's direction, whether it has been sufficiently explored in chat, or whether it is mature enough to promote. The PRD calls for relevance ranking that "re-computes as the document evolves," but the current implementation cannot assess semantic quality.

## Goal

Replace the heuristic ranking with an LLM-scored system that evaluates each insight on two dimensions:

1. **Relevance** -- how useful the insight is to the document's current direction.
2. **Maturity** -- how developed and ready-to-promote the insight is, based on chat discussion depth.

These scores drive sort order in the Insight Tray and feed visual indicators on each Insight Card (see companion speclet: *Visual Relevance and Maturity Indicators on Insight Cards*).

## Design Decisions

### Two-score model

Each insight receives two scores from the LLM:

| Score | Range | Meaning |
|-------|-------|---------|
| `relevance` | 0 -- 10 | How aligned the insight is with the document's current content and trajectory |
| `maturity` | 0 -- 10 | How well-explored the insight is (discussed in chat, has supporting arguments, ready to promote) |

A `relevance` of 0 means the insight is tangential. A `maturity` of 0 means the idea is a raw seed with no discussion.

### Score of 0 means "unscored / pending"

When an insight is first created, both `relevance` and `maturity` default to 0. Unscored insights (score = 0) appear at the bottom of the tray in creation order until the scoring agent completes its next batch run and assigns real scores.

### Sort order

Primary sort: `relevance` descending.
Secondary sort (tie-breaker): `maturity` descending.
Tertiary sort (tie-breaker): `created_at` ascending (older first).

Insights with `relevance = 0` (unscored) sink to the bottom, ordered by creation time.

### Batch scoring mode

The scoring agent always operates in batch mode: it receives **all active (non-archived) insights** in a single LLM call so it can make relative judgments. This lets the LLM compare insights against each other and against the document simultaneously, producing more consistent scores than one-at-a-time evaluation.

### When scoring fires

The scoring agent re-scores all active insights in these situations:

1. **After a chat response lands** -- the conversation may have deepened or touched on one or more insights, changing their maturity.
2. **After new insights are extracted or manually created** -- new insights need initial scores, and existing insight relevance may shift in context.
3. **After a document block is promoted / patch accepted** -- the document's content has changed, potentially shifting which insights are most relevant.

In all three cases the agent fires as a background task (non-blocking), receives the full set of active insights, the current document text, and recent chat history, and returns updated scores for every insight.

### Re-scoring on chat discussion

If an insight is being actively discussed in chat (status = `discussing`, or the chat mentions content closely related to an insight), the scoring agent will update that insight's maturity score upward on its next batch run. The LLM prompt instructs the scorer to check recent chat messages for discussion related to each insight.

## Data Model Changes

### Insight type extension

Add two fields to the `Insight` interface in `src/types/index.ts`:

```
relevance: number   // 0-10, default 0
maturity: number    // 0-10, default 0
```

### insightStore changes

- `addInsight` sets `relevance: 0` and `maturity: 0` on creation.
- Add `setInsightScores(insightId: string, relevance: number, maturity: number)` action.
- `getActiveInsights` continues to filter out archived insights; sorting moves to the tray component.

### RankingResult extension

Update `RankingResult` in `actions.ts`:

```
export interface RankingResult {
  scores: Record<string, { relevance: number; maturity: number }>;
}
```

The current `Record<string, number>` shape becomes a record of objects with both dimensions.

## Ranking Agent Changes

### System prompt update

The ranking agent's system prompt will instruct the LLM to:

1. Read the full document text.
2. Read all active insights (title, content, status, created_at).
3. Read recent chat messages (last N messages for maturity assessment).
4. For each insight, produce a `relevance` score (0-10) and a `maturity` score (0-10).
5. Return a JSON object mapping insight IDs to `{ relevance, maturity }`.

### Input context

The agent receives via `AgentContext`:
- `stores.blocks` -- current document blocks
- `stores.insights` -- all active insights
- `stores.messages` -- recent chat messages (for maturity assessment)

### Output

The agent returns `RankingResult` with the updated two-dimensional scores. The orchestrator writes these scores back to the insight store via `setInsightScores`.

## InsightTray Sort Logic

Replace the current `rankedInsights` memo in `InsightTray.tsx`:

```
const rankedInsights = useMemo(() => {
  return [...activeInsights].sort((a, b) => {
    // Unscored insights sink to bottom
    const aScored = a.relevance > 0 ? 1 : 0;
    const bScored = b.relevance > 0 ? 1 : 0;
    if (aScored !== bScored) return bScored - aScored;

    // Primary: relevance descending
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;

    // Secondary: maturity descending
    if (b.maturity !== a.maturity) return b.maturity - a.maturity;

    // Tertiary: creation time ascending
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}, [activeInsights]);
```

The current call to `computeRelevanceScores` inside the tray component is removed. Scoring is handled entirely by the background agent writing to the store.

## Background Scheduling

The background agent scheduler (`src/lib/ai/background.ts`) triggers `ranking.score` after:
- `chat.respond` completes
- `insight.extract` completes or a manual insight is added
- `document.promote` patch is accepted

This aligns with the three trigger events described above. The scheduler passes the action `{ type: "ranking.score", input: {} }` and the orchestrator routes to the ranking agent.

## Migration Path

1. Add `relevance` and `maturity` fields to `Insight` type (default 0).
2. Update `insightStore` with new fields and `setInsightScores` action.
3. Update `RankingResult` to the two-dimensional shape.
4. Rewrite ranking agent's `run()` to produce two scores per insight.
5. Update `InsightTray.tsx` to sort by store-held scores instead of calling `computeRelevanceScores`.
6. Add background trigger wiring in `background.ts`.
7. Remove the inline `computeRelevanceScores` call from `InsightTray.tsx`.

## What This Does NOT Cover

- Visual indicators on Insight Cards (see companion speclet).
- Changes to the knowledge graph or contradiction detection.
- Persisting scores to a database (scores are recalculated on each trigger and held in Zustand).
