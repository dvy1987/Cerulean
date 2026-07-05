"use client";

import { useSuggestionStore } from "@/store/suggestionStore";

interface ThinkingSuggestionsProps {
  onSelectSuggestion: (text: string) => void;
  onSaveAsInsight: (text: string) => void;
}

export default function ThinkingSuggestions({
  onSelectSuggestion,
  onSaveAsInsight,
}: ThinkingSuggestionsProps) {
  const suggestions = useSuggestionStore((s) => s.suggestions);

  if (suggestions.length === 0) return null;

  const sourceStyles: Record<string, string> = {
    unresolved_insight: "bg-warning-50 text-warning-700 border-warning-100 hover:bg-warning-100",
    document_gap: "bg-cerulean-50 text-cerulean-700 border-cerulean-100 hover:bg-cerulean-100",
    contradiction: "bg-danger-50 text-danger-700 border-danger-100 hover:bg-danger-100",
    context: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
  };

  return (
    <div className="px-4 py-2.5 border-t border-gray-100 bg-white">
      <p className="text-[10px] text-muted mb-2 font-medium uppercase tracking-wider">
        Continue Thinking
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <div key={s.suggestion_id} className="flex items-center gap-1">
            <button
              onClick={() => onSelectSuggestion(s.text)}
              className={`text-[11px] px-3 py-1.5 rounded-lg border font-medium hover:shadow-soft ${
                sourceStyles[s.source] || sourceStyles.context
              }`}
            >
              {s.text}
            </button>
            <button
              onClick={() => onSaveAsInsight(s.text)}
              className="text-[10px] text-muted hover:text-cerulean-600 hover:bg-cerulean-50 w-5 h-5 rounded-md flex items-center justify-center"
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
