"use client";

import { useState, useMemo } from "react";
import { useInsightStore } from "@/store/insightStore";
import { useDocumentStore } from "@/store/documentStore";
import {
  generatePromotionPatch,
  insightToPrompt,
  detectContradictions,
} from "@/lib/ai";
import { Insight } from "@/types";
import { v4 as uuidv4 } from "uuid";
import InsightCard from "./InsightCard";

export default function InsightTray() {
  const {
    insights,
    isTrayOpen,
    toggleTray,
    addInsight,
    setInsightStatus,
    archiveInsight,
  } = useInsightStore();
  const { blocks, setPendingPatch, document: doc } = useDocumentStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newInsightText, setNewInsightText] = useState("");

  const activeInsights = insights.filter((i) => i.status !== "archived");
  const count = activeInsights.length;

  const contradictions = useMemo(() => {
    return detectContradictions(
      activeInsights.map((i) => ({
        insight_id: i.insight_id,
        content: i.content,
      }))
    );
  }, [activeInsights]);

  const contradictionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of contradictions) {
      ids.add(c.insight_a_id);
      ids.add(c.insight_b_id);
    }
    return ids;
  }, [contradictions]);

  const rankedInsights = useMemo(() => {
    return [...activeInsights].sort((a, b) => {
      const aScored = a.relevance > 0 ? 1 : 0;
      const bScored = b.relevance > 0 ? 1 : 0;
      if (aScored !== bScored) return bScored - aScored;
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      if (b.maturity !== a.maturity) return b.maturity - a.maturity;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [activeInsights]);

  const handleAddInsight = () => {
    const text = newInsightText.trim();
    if (!text) return;
    addInsight({
      title: text.slice(0, 60) + (text.length > 60 ? "..." : ""),
      content: text,
    });
    setNewInsightText("");
    setIsAdding(false);
  };

  const handlePromote = (insight: Insight) => {
    const operations = generatePromotionPatch(
      insight.content,
      blocks,
      insight.insight_id,
      insight.source_message_ids
    );
    const patch = {
      patch_id: uuidv4(),
      document_id: doc.document_id,
      operations,
      status: "pending" as const,
      source_insight_id: insight.insight_id,
      source_text: insight.content,
      created_at: new Date().toISOString(),
    };
    setPendingPatch(patch);
    setInsightStatus(insight.insight_id, "promoted");
  };

  const handleExplore = (insight: Insight) => {
    setInsightStatus(insight.insight_id, "discussing");
    const prompt = insightToPrompt(insight.title, insight.content);
    window.dispatchEvent(
      new CustomEvent("insight-to-prompt", { detail: prompt })
    );
  };

  return (
    <div className="border-t border-gray-200 bg-white shadow-[0_-1px_3px_0_rgba(0,0,0,0.03)]">
      <button
        onClick={toggleTray}
        className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-foreground">
            Insights
          </span>
          {count > 0 && (
            <span className="text-[10px] font-semibold bg-cerulean-100 text-cerulean-700 px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {count}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-muted ${
            isTrayOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>

      {isTrayOpen && (
        <div className="px-5 pb-4 max-h-80 overflow-y-auto animate-slideDown">
          {isAdding ? (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newInsightText}
                onChange={(e) => setNewInsightText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddInsight();
                  if (e.key === "Escape") setIsAdding(false);
                }}
                placeholder="Type an insight..."
                autoFocus
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2
                  focus:outline-none focus:border-cerulean-300 focus:ring-2 focus:ring-cerulean-100"
              />
              <button
                onClick={handleAddInsight}
                className="text-xs font-medium px-4 py-2 bg-cerulean-500 text-white rounded-lg hover:bg-cerulean-600"
              >
                Save
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="text-xs px-3 py-2 text-muted hover:text-foreground hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs font-medium text-cerulean-600 hover:text-cerulean-700 hover:bg-cerulean-50 mb-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            >
              <span className="text-sm">+</span> Add Insight
            </button>
          )}

          {contradictions.length > 0 && (
            <div className="mb-3 p-3 bg-danger-50 border border-danger-100 rounded-xl">
              <p className="text-[11px] font-semibold text-danger-700">
                {contradictions.length} potential contradiction{contradictions.length > 1 ? "s" : ""} detected
              </p>
              {contradictions.map((c, i) => (
                <p key={i} className="text-[10px] text-danger-600 mt-0.5 leading-relaxed">
                  {c.description}
                </p>
              ))}
            </div>
          )}

          {rankedInsights.length === 0 && (
            <p className="text-xs text-muted text-center py-6">
              No insights yet. Capture ideas from chat or add them manually.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {rankedInsights.map((insight) => (
              <InsightCard
                key={insight.insight_id}
                insight={insight}
                onPromote={handlePromote}
                onArchive={archiveInsight}
                onExplore={handleExplore}
                hasContradiction={contradictionIds.has(insight.insight_id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
