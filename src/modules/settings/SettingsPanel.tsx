"use client";

import { useState } from "react";
import { useAiSettingsStore, CustomAiProvider } from "@/store/aiSettingsStore";

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

const PROVIDER_MODELS: Record<Exclude<CustomAiProvider, "">, { label: string; models: { value: string; label: string }[] }> = {
  anthropic: {
    label: "Anthropic",
    models: [
      { value: "claude-haiku-4-5", label: "Claude Haiku (Fast)" },
      { value: "claude-sonnet-4-5", label: "Claude Sonnet (Balanced)" },
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4 (Latest)" },
    ],
  },
  openai: {
    label: "OpenAI",
    models: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast)" },
      { value: "gpt-4o", label: "GPT-4o (Balanced)" },
    ],
  },
  gemini: {
    label: "Gemini",
    models: [
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Fast)" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Balanced)" },
    ],
  },
};

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const backgroundAgents = useAiSettingsStore((s) => s.backgroundAgents);
  const toggleBackgroundAgent = useAiSettingsStore((s) => s.toggleBackgroundAgent);

  const customProvider = useAiSettingsStore((s) => s.customProvider);
  const customModel = useAiSettingsStore((s) => s.customModel);
  const customApiKey = useAiSettingsStore((s) => s.customApiKey);
  const setCustomProvider = useAiSettingsStore((s) => s.setCustomProvider);
  const setCustomModel = useAiSettingsStore((s) => s.setCustomModel);
  const setCustomApiKey = useAiSettingsStore((s) => s.setCustomApiKey);

  const [showKey, setShowKey] = useState(false);

  function handleProviderChange(value: string) {
    const provider = value as CustomAiProvider;
    setCustomProvider(provider);
    if (provider && provider in PROVIDER_MODELS) {
      setCustomModel(PROVIDER_MODELS[provider as Exclude<CustomAiProvider, "">].models[0].value);
    } else {
      setCustomModel("");
    }
  }

  const activeModels = customProvider && customProvider in PROVIDER_MODELS
    ? PROVIDER_MODELS[customProvider as Exclude<CustomAiProvider, "">].models
    : [];

  const isConfigured = customProvider && customModel && customApiKey.length > 0;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50 transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-11 flex items-center justify-between px-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-cerulean-700">Settings</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-2.75rem)] space-y-6">
          {/* AI Provider */}
          <div>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
              AI Provider
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1">Provider</label>
                <select
                  value={customProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-cerulean-400"
                >
                  <option value="">Use server default</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>

              {customProvider && (
                <>
                  <div>
                    <label className="text-xs text-muted block mb-1">Model</label>
                    <select
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-cerulean-400"
                    >
                      {activeModels.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">API Key</label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 pr-14 bg-white text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cerulean-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground transition-colors"
                      >
                        {showKey ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div
                    className={`text-xs px-2.5 py-1.5 rounded-md ${
                      isConfigured
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isConfigured
                      ? `Connected to ${PROVIDER_MODELS[customProvider as Exclude<CustomAiProvider, "">].label}`
                      : "Enter an API key to connect"}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Background Agents */}
          <div>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
              Background Agents
            </h3>

            <div className="space-y-3">
              {agentToggles.map(({ key, label, description }) => (
                <div key={key} className="flex items-start justify-between gap-3">
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
      </div>
    </>
  );
}
