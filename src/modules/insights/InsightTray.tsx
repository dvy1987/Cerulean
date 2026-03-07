"use client";

import { useState } from "react";
import { useInsightStore } from "@/store/insightStore";
import { useDocumentStore } from "@/store/documentStore";
import { generatePromotionPatch, insightToPrompt } from "@/lib/ai";
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
    // Dispatch custom event for ChatPanel to pick up
    window.dispatchEvent(
      new CustomEvent("insight-to-prompt", { detail: prompt })
    );
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Tray header - always visible */}
      <button
        onClick={toggleTray}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Insights
          </span>
          {count > 0 && (
            <span className="text-[10px] font-medium bg-cerulean-100 text-cerulean-700 px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-muted transition-transform ${
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

      {/* Tray content */}
      {isTrayOpen && (
        <div className="px-4 pb-3 max-h-64 overflow-y-auto">
          {/* Add insight button / form */}
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
                className="flex-1 text-sm border border-gray-200 rounded-md px-2 py-1.5
                  focus:outline-none focus:border-cerulean-300 focus:ring-1 focus:ring-cerulean-200"
              />
              <button
                onClick={handleAddInsight}
                className="text-xs px-3 py-1.5 bg-cerulean-500 text-white rounded-md hover:bg-cerulean-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="text-xs px-2 py-1.5 text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs text-cerulean-600 hover:text-cerulean-700 mb-3 flex items-center gap-1"
            >
              <span className="text-sm">+</span> Add Insight
            </button>
          )}

          {/* Insight list */}
          {activeInsights.length === 0 && (
            <p className="text-xs text-muted text-center py-4">
              No insights yet. Capture ideas from chat or add them manually.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeInsights.map((insight) => (
              <InsightCard
                key={insight.insight_id}
                insight={insight}
                onPromote={handlePromote}
                onArchive={archiveInsight}
                onExplore={handleExplore}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
