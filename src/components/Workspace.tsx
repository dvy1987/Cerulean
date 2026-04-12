"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ChatPanel from "@/modules/chat/ChatPanel";
import DocumentPanel from "@/modules/document/DocumentPanel";
import DocumentImport from "@/modules/document/DocumentImport";
import InsightTray from "@/modules/insights/InsightTray";
import GraphView from "@/modules/graph/GraphView";
import SettingsPanel from "@/modules/settings/SettingsPanel";
import ExemplarUpload from "@/modules/settings/ExemplarUpload";

type RightTab = "document" | "graph";

const SNAP_THRESHOLD = 0.1;
const SNAP_RESTORE = 0.5;
const MIN_DRAG = 0.02;

export default function Workspace() {
  const [rightTab, setRightTab] = useState<RightTab>("document");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exemplarsOpen, setExemplarsOpen] = useState(false);

  const [splitFraction, setSplitFraction] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const chatCollapsed = splitFraction === 0;
  const docCollapsed = splitFraction === 1;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let fraction = (e.clientX - rect.left) / rect.width;
      fraction = Math.max(MIN_DRAG, Math.min(1 - MIN_DRAG, fraction));

      if (fraction < SNAP_THRESHOLD) {
        fraction = 0;
      } else if (fraction > 1 - SNAP_THRESHOLD) {
        fraction = 1;
      }

      setSplitFraction(fraction);
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const restoreChat = () => setSplitFraction(SNAP_RESTORE);
  const restoreDoc = () => setSplitFraction(SNAP_RESTORE);

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

      <div
        ref={containerRef}
        className="flex-1 flex min-h-0 relative"
        onPointerMove={isDragging ? handlePointerMove : undefined}
        onPointerUp={isDragging ? handlePointerUp : undefined}
      >
        {chatCollapsed ? (
          <button
            onClick={restoreChat}
            className="shrink-0 w-7 flex flex-col items-center justify-center gap-1
              bg-gray-50 hover:bg-gray-100 border-r border-gray-200
              transition-colors duration-150 group"
            title="Expand Chat"
          >
            <span
              className="text-[10px] font-medium text-muted group-hover:text-foreground
                [writing-mode:vertical-lr] rotate-180 tracking-wide"
            >
              Chat
            </span>
          </button>
        ) : (
          <div
            className="flex flex-col min-h-0 relative"
            style={{ width: `${splitFraction * 100}%` }}
          >
            <ChatPanel />
          </div>
        )}

        {!chatCollapsed && !docCollapsed && (
          <div
            onPointerDown={handlePointerDown}
            className={`shrink-0 w-1.5 cursor-col-resize relative z-20 group
              flex items-center justify-center
              ${isDragging ? "bg-cerulean-200" : "bg-gray-200 hover:bg-cerulean-300"}`}
          >
            <div
              className={`w-0.5 h-8 rounded-full transition-colors duration-100
                ${isDragging ? "bg-cerulean-500" : "bg-gray-400 group-hover:bg-cerulean-400"}`}
            />
          </div>
        )}

        {docCollapsed ? (
          <button
            onClick={restoreDoc}
            className="shrink-0 w-7 flex flex-col items-center justify-center gap-1
              bg-gray-50 hover:bg-gray-100 border-l border-gray-200
              transition-colors duration-150 group"
            title="Expand Document"
          >
            <span
              className="text-[10px] font-medium text-muted group-hover:text-foreground
                [writing-mode:vertical-lr] tracking-wide"
            >
              Document
            </span>
          </button>
        ) : (
          <div
            className="flex flex-col min-h-0"
            style={{ width: `${(1 - splitFraction) * 100}%` }}
          >
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
        )}
      </div>

      <InsightTray />

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ExemplarUpload open={exemplarsOpen} onClose={() => setExemplarsOpen(false)} />
    </div>
  );
}
