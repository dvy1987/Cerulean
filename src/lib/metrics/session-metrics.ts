/**
 * Client-side session metrics for Thinking Loop v2 success criteria.
 * Stored in sessionStorage — no PII, no server round-trip required.
 */

const STORAGE_KEY = "cerulean_session_metrics_v1";

export type MetricEvent =
  | "chat_turn"
  | "proposals_shown"
  | "insight_saved_manual"
  | "insight_saved_proposal"
  | "promotion_created"
  | "promotion_accepted"
  | "promotion_rejected"
  | "template_applied";

export interface SessionMetrics {
  sessionStartedAt: number;
  chatTurns: number;
  proposalsShown: number;
  insightsSavedManual: number;
  insightsSavedProposal: number;
  promotionsCreated: number;
  promotionsAccepted: number;
  promotionsRejected: number;
  templatesApplied: number;
  firstInsightSavedAt: number | null;
  firstChatTurnAt: number | null;
}

function defaultMetrics(): SessionMetrics {
  const now = Date.now();
  return {
    sessionStartedAt: now,
    chatTurns: 0,
    proposalsShown: 0,
    insightsSavedManual: 0,
    insightsSavedProposal: 0,
    promotionsCreated: 0,
    promotionsAccepted: 0,
    promotionsRejected: 0,
    templatesApplied: 0,
    firstInsightSavedAt: null,
    firstChatTurnAt: null,
  };
}

export function getSessionMetrics(): SessionMetrics {
  if (typeof window === "undefined") return defaultMetrics();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMetrics();
    return { ...defaultMetrics(), ...JSON.parse(raw) };
  } catch {
    return defaultMetrics();
  }
}

function persist(metrics: SessionMetrics): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
}

export function trackMetric(
  event: MetricEvent,
  detail?: { count?: number }
): SessionMetrics {
  const metrics = getSessionMetrics();
  const count = detail?.count ?? 1;
  const now = Date.now();

  switch (event) {
    case "chat_turn":
      metrics.chatTurns += count;
      if (!metrics.firstChatTurnAt) metrics.firstChatTurnAt = now;
      break;
    case "proposals_shown":
      metrics.proposalsShown += count;
      break;
    case "insight_saved_manual":
      metrics.insightsSavedManual += count;
      if (!metrics.firstInsightSavedAt) metrics.firstInsightSavedAt = now;
      break;
    case "insight_saved_proposal":
      metrics.insightsSavedProposal += count;
      if (!metrics.firstInsightSavedAt) metrics.firstInsightSavedAt = now;
      break;
    case "promotion_created":
      metrics.promotionsCreated += count;
      break;
    case "promotion_accepted":
      metrics.promotionsAccepted += count;
      break;
    case "promotion_rejected":
      metrics.promotionsRejected += count;
      break;
    case "template_applied":
      metrics.templatesApplied += count;
      break;
  }

  persist(metrics);
  return metrics;
}

/** Derived KPIs aligned with thinking-loop-v2 success metrics. */
export function getSessionKpis(metrics: SessionMetrics = getSessionMetrics()) {
  const insightsSaved =
    metrics.insightsSavedManual + metrics.insightsSavedProposal;
  const timeToFirstInsightMs =
    metrics.firstInsightSavedAt && metrics.firstChatTurnAt
      ? metrics.firstInsightSavedAt - metrics.firstChatTurnAt
      : null;
  const promotionAcceptRate =
    metrics.promotionsCreated > 0
      ? metrics.promotionsAccepted / metrics.promotionsCreated
      : null;

  return {
    insightsSaved,
    timeToFirstInsightMs,
    promotionAcceptRate,
    chatTurns: metrics.chatTurns,
    proposalsShown: metrics.proposalsShown,
  };
}
