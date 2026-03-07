"use client";

import ChatPanel from "@/modules/chat/ChatPanel";
import DocumentPanel from "@/modules/document/DocumentPanel";
import InsightTray from "@/modules/insights/InsightTray";

export default function Workspace() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-11 flex items-center px-4 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-sm font-semibold text-cerulean-700 tracking-tight">
          Cerulean
        </h1>
        <span className="ml-2 text-[10px] text-muted font-medium">
          Thinking Workspace
        </span>
      </header>

      {/* Main panels */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Chat */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col min-h-0 relative">
          <ChatPanel />
        </div>

        {/* Right: Document */}
        <div className="w-1/2 flex flex-col min-h-0">
          <DocumentPanel />
        </div>
      </div>

      {/* Bottom: Insight Tray */}
      <InsightTray />
    </div>
  );
}
