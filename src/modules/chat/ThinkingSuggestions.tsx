"use client";

import { useMemo } from "react";
import { useInsightStore } from "@/store/insightStore";
import { useDocumentStore } from "@/store/documentStore";
import { generateThinkingSuggestions, detectContradictions } from "@/lib/ai";

interface ThinkingSuggestionsProps {
  onSelectSuggestion: (text: string) => void;
  onSaveAsInsight: (text: string) => void;
}

export default function ThinkingSuggestions({
  onSelectSuggestion,
  onSaveAsInsight,
}: ThinkingSuggestionsProps) {
  const insights = useInsightStore((s) => s.insights);
  const blocks = useDocumentStore((s) => s.blocks);

  const suggestions = useMemo(() => {
    const unresolved = insights
      .filter((i) => i.status === "captured" || i.status === "discussing")
      .map((i) => ({ insight_id: i.insight_id, title: i.title }));

    const activeInsights = insights.filter((i) => i.status !== "archived");
    const contradictions = detectContradictions(
      activeInsights.map((i) => ({
        insight_id: i.insight_id,
        content: i.content,
      }))
    );

    return generateThinkingSuggestions(
      unresolved,
      blocks.length,
      contradictions.length > 0
    );
  }, [insights, blocks.length]);

  if (suggestions.length === 0) return null;

  const sourceColors: Record<string, string> = {
    unresolved_insight: "bg-amber-50 text-amber-700 border-amber-200",
    document_gap: "bg-cerulean-50 text-cerulean-700 border-cerulean-200",
    contradiction: "bg-red-50 text-red-700 border-red-200",
    context: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div className="px-3 py-2 border-t border-gray-100">
      <p className="text-[10px] text-muted mb-1.5 font-medium">
        Continue Thinking
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-center gap-0.5">
            <button
              onClick={() => onSelectSuggestion(s.text)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors hover:opacity-80 ${
                sourceColors[s.source] || sourceColors.context
              }`}
            >
              {s.text}
            </button>
            <button
              onClick={() => onSaveAsInsight(s.text)}
              className="text-[9px] text-muted hover:text-cerulean-600 p-0.5"
              title="Save as insight"
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
