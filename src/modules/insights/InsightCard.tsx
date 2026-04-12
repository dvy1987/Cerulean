"use client";

import { Insight } from "@/types";

interface InsightCardProps {
  insight: Insight;
  onPromote: (insight: Insight) => void;
  onArchive: (insightId: string) => void;
  onExplore: (insight: Insight) => void;
  hasContradiction?: boolean;
}

const STATUS_STYLES: Record<string, { badge: string; accent: string }> = {
  captured: { badge: "bg-warning-100 text-warning-700", accent: "border-l-warning-500" },
  discussing: { badge: "bg-cerulean-100 text-cerulean-700", accent: "border-l-cerulean-500" },
  resolved: { badge: "bg-success-100 text-success-700", accent: "border-l-success-500" },
  promoted: { badge: "bg-cerulean-100 text-cerulean-700", accent: "border-l-cerulean-500" },
  archived: { badge: "bg-gray-100 text-gray-500", accent: "border-l-gray-300" },
};

function getRelevanceDotClass(score: number): string {
  if (score === 0) return "bg-gray-300";
  if (score <= 3) return "bg-gray-400";
  if (score <= 6) return "bg-cerulean-400";
  if (score <= 8) return "bg-cerulean-500";
  return "bg-cerulean-600 shadow-[0_0_4px_rgba(56,189,248,0.5)]";
}

function getMaturityBarClass(score: number): string {
  if (score <= 3) return "bg-amber-400";
  if (score <= 6) return "bg-cerulean-300";
  if (score <= 8) return "bg-cerulean-400";
  return "bg-emerald-400";
}

export default function InsightCard({
  insight,
  onPromote,
  onArchive,
  onExplore,
  hasContradiction,
}: InsightCardProps) {
  const styles = STATUS_STYLES[insight.status] || STATUS_STYLES.captured;

  return (
    <div
      className={`bg-white border rounded-xl p-3.5 group border-l-2 shadow-soft hover:shadow-medium ${
        hasContradiction
          ? "border-danger-200 border-l-danger-500 hover:border-danger-300"
          : `border-gray-100 ${styles.accent} hover:border-cerulean-200`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {insight.title}
          </p>
          <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
            {insight.content}
          </p>
          {hasContradiction && (
            <span className="text-[9px] text-danger-500 font-medium mt-1 block">
              Potential contradiction
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${getRelevanceDotClass(insight.relevance)}`}
            title={insight.relevance === 0 ? "Relevance: scoring..." : `Relevance: ${insight.relevance}/10`}
          />
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${styles.badge}`}
          >
            {insight.status}
          </span>
        </div>
      </div>
      {insight.maturity > 0 && (
        <div className="mt-2 h-0.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${getMaturityBarClass(insight.maturity)}`}
            style={{ width: `${insight.maturity * 10}%` }}
            title={`Maturity: ${insight.maturity}/10`}
          />
        </div>
      )}
      <div className="flex gap-1.5 mt-2.5 opacity-0 group-hover:opacity-100">
        {insight.status !== "promoted" && (
          <button
            onClick={() => onPromote(insight)}
            className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-cerulean-50 text-cerulean-600 hover:bg-cerulean-100"
          >
            Promote
          </button>
        )}
        <button
          onClick={() => onExplore(insight)}
          className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100"
        >
          Explore
        </button>
        {insight.status !== "archived" && (
          <button
            onClick={() => onArchive(insight.insight_id)}
            className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-gray-50 text-gray-400 hover:bg-danger-50 hover:text-danger-500"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
