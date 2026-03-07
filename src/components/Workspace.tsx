"use client";

import { useState } from "react";
import ChatPanel from "@/modules/chat/ChatPanel";
import DocumentPanel from "@/modules/document/DocumentPanel";
import DocumentImport from "@/modules/document/DocumentImport";
import InsightTray from "@/modules/insights/InsightTray";
import GraphView from "@/modules/graph/GraphView";

type RightTab = "document" | "graph";

export default function Workspace() {
  const [rightTab, setRightTab] = useState<RightTab>("document");

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-11 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center">
          <h1 className="text-sm font-semibold text-cerulean-700 tracking-tight">
            Cerulean
          </h1>
          <span className="ml-2 text-[10px] text-muted font-medium">
            Thinking Workspace
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DocumentImport />
        </div>
      </header>

      {/* Main panels */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Chat */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col min-h-0 relative">
          <ChatPanel />
        </div>

        {/* Right: Document / Graph */}
        <div className="w-1/2 flex flex-col min-h-0">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-100 bg-white shrink-0">
            <button
              onClick={() => setRightTab("document")}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                rightTab === "document"
                  ? "text-cerulean-600 border-b-2 border-cerulean-500"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Document
            </button>
            <button
              onClick={() => setRightTab("graph")}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                rightTab === "graph"
                  ? "text-cerulean-600 border-b-2 border-cerulean-500"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Graph
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0">
            {rightTab === "document" ? <DocumentPanel /> : <GraphView />}
          </div>
        </div>
      </div>

      {/* Bottom: Insight Tray */}
      <InsightTray />
    </div>
  );
}
