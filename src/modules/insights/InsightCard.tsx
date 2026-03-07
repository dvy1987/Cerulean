"use client";

import { Insight } from "@/types";

interface InsightCardProps {
  insight: Insight;
  onPromote: (insight: Insight) => void;
  onArchive: (insightId: string) => void;
  onExplore: (insight: Insight) => void;
  hasContradiction?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  captured: "bg-amber-100 text-amber-700",
  discussing: "bg-cerulean-100 text-cerulean-700",
  resolved: "bg-green-100 text-green-700",
  promoted: "bg-purple-100 text-purple-700",
  archived: "bg-gray-100 text-gray-500",
};

export default function InsightCard({
  insight,
  onPromote,
  onArchive,
  onExplore,
  hasContradiction,
}: InsightCardProps) {
  return (
    <div
      className={`bg-white border rounded-lg p-3 group transition-colors ${
        hasContradiction
          ? "border-red-200 hover:border-red-300"
          : "border-gray-100 hover:border-cerulean-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {insight.title}
          </p>
          <p className="text-xs text-muted mt-0.5 line-clamp-2">
            {insight.content}
          </p>
          {hasContradiction && (
            <span className="text-[9px] text-red-500 mt-0.5 block">
              ⚠ Potential contradiction
            </span>
          )}
        </div>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
            STATUS_COLORS[insight.status] || STATUS_COLORS.captured
          }`}
        >
          {insight.status}
        </span>
      </div>
      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {insight.status !== "promoted" && (
          <button
            onClick={() => onPromote(insight)}
            className="text-[10px] px-2 py-1 rounded bg-cerulean-50 text-cerulean-600 hover:bg-cerulean-100 transition-colors"
          >
            Promote
          </button>
        )}
        <button
          onClick={() => onExplore(insight)}
          className="text-[10px] px-2 py-1 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Explore
        </button>
        {insight.status !== "archived" && (
          <button
            onClick={() => onArchive(insight.insight_id)}
            className="text-[10px] px-2 py-1 rounded bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
