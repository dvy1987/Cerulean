"use client";

import { useAiSettingsStore } from "@/store/aiSettingsStore";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const agentToggles: {
  key: "knowledgeGraph" | "ranking" | "suggestion" | "tonalAdjustment";
  label: string;
  description: string;
}[] = [
  {
    key: "knowledgeGraph",
    label: "Knowledge Graph",
    description: "Auto-update knowledge graph as you work",
  },
  {
    key: "ranking",
    label: "Insight Ranking",
    description: "Re-rank insights by relevance to document",
  },
  {
    key: "suggestion",
    label: "Suggestions",
    description: "Suggest next topics and insights",
  },
  {
    key: "tonalAdjustment",
    label: "Tonal Adjustment",
    description: "Match promoted content to document tone",
  },
];

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const backgroundAgents = useAiSettingsStore((s) => s.backgroundAgents);
  const toggleBackgroundAgent = useAiSettingsStore(
    (s) => s.toggleBackgroundAgent
  );

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50 transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-11 flex items-center justify-between px-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-cerulean-700">Settings</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-2.75rem)]">
          {/* Background Agents */}
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
            Background Agents
          </h3>

          <div className="space-y-3">
            {agentToggles.map(({ key, label, description }) => (
              <div
                key={key}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted mt-0.5">{description}</p>
                </div>
                <button
                  onClick={() => toggleBackgroundAgent(key)}
                  className={`relative shrink-0 mt-0.5 w-8 h-[18px] rounded-full transition-colors ${
                    backgroundAgents[key] ? "bg-cerulean-500" : "bg-gray-300"
                  }`}
                  aria-label={`Toggle ${label}`}
                >
                  <div
                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${
                      backgroundAgents[key]
                        ? "translate-x-[16px]"
                        : "translate-x-[2px]"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
