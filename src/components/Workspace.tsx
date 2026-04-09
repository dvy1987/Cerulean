"use client";

import { useState } from "react";
import ChatPanel from "@/modules/chat/ChatPanel";
import DocumentPanel from "@/modules/document/DocumentPanel";
import DocumentImport from "@/modules/document/DocumentImport";
import InsightTray from "@/modules/insights/InsightTray";
import GraphView from "@/modules/graph/GraphView";
import SettingsPanel from "@/modules/settings/SettingsPanel";
import ExemplarUpload from "@/modules/settings/ExemplarUpload";

type RightTab = "document" | "graph";

export default function Workspace() {
  const [rightTab, setRightTab] = useState<RightTab>("document");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exemplarsOpen, setExemplarsOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-12 flex items-center justify-between px-5 bg-white shadow-soft shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cerulean-400 to-cerulean-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">C</span>
            </div>
            <h1 className="text-sm font-semibold text-cerulean-800 tracking-tight">
              Cerulean
            </h1>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <span className="text-[11px] text-muted font-medium">
            Thinking Workspace
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <DocumentImport />
          <button
            onClick={() => setExemplarsOpen(true)}
            className="text-xs text-muted hover:text-foreground hover:bg-gray-50 px-2.5 py-1.5 rounded-md"
          >
            Exemplars
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-xs text-muted hover:text-foreground hover:bg-gray-50 px-2.5 py-1.5 rounded-md"
            title="Settings"
          >
            Settings
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="w-1/2 flex flex-col min-h-0 relative">
          <ChatPanel />
        </div>

        <div className="w-px bg-gray-200" />

        <div className="w-1/2 flex flex-col min-h-0">
          <div className="flex items-center gap-1 px-2 border-b border-gray-100 bg-white shrink-0">
            <button
              onClick={() => setRightTab("document")}
              className={`px-3 py-2.5 text-xs font-medium relative ${
                rightTab === "document"
                  ? "text-cerulean-600"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Document
              {rightTab === "document" && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-cerulean-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setRightTab("graph")}
              className={`px-3 py-2.5 text-xs font-medium relative ${
                rightTab === "graph"
                  ? "text-cerulean-600"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Graph
              {rightTab === "graph" && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-cerulean-500 rounded-full" />
              )}
            </button>
          </div>

          <div className="flex-1 min-h-0">
            {rightTab === "document" ? <DocumentPanel /> : <GraphView />}
          </div>
        </div>
      </div>

      <InsightTray />

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ExemplarUpload open={exemplarsOpen} onClose={() => setExemplarsOpen(false)} />
    </div>
  );
}
