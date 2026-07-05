"use client";

import { useState, useEffect } from "react";
import { useAiSettingsStore, CustomAiProvider } from "@/store/aiSettingsStore";
import { isPersistenceEnabled } from "@/lib/config";
import { workspaceApi } from "@/lib/api/workspace-client";

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
  openrouter: {
    label: "OpenRouter",
    models: [
      { value: "openrouter/auto:free", label: "Auto (Best Free)" },
      { value: "qwen/qwen3-235b-a22b:free", label: "Qwen3 235B [Free]" },
      { value: "qwen/qwen3-30b-a3b:free", label: "Qwen3 30B [Free]" },
      { value: "google/gemini-2.5-flash-preview:free", label: "Gemini 2.5 Flash [Free]" },
      { value: "google/gemma-3-27b-it:free", label: "Gemma 3 27B [Free]" },
      { value: "meta-llama/llama-4-maverick:free", label: "Llama 4 Maverick [Free]" },
      { value: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3 [Free]" },
      { value: "anthropic/claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { value: "openai/gpt-4o", label: "GPT-4o" },
      { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
      { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { value: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3" },
    ],
  },
};

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const backgroundAgents = useAiSettingsStore((s) => s.backgroundAgents);
  const toggleBackgroundAgent = useAiSettingsStore((s) => s.toggleBackgroundAgent);
  const suggestInsights = useAiSettingsStore((s) => s.suggestInsights);
  const advancedMode = useAiSettingsStore((s) => s.advancedMode);
  const setSuggestInsights = useAiSettingsStore((s) => s.setSuggestInsights);
  const setAdvancedMode = useAiSettingsStore((s) => s.setAdvancedMode);

  const customProvider = useAiSettingsStore((s) => s.customProvider);
  const customModel = useAiSettingsStore((s) => s.customModel);
  const customApiKey = useAiSettingsStore((s) => s.customApiKey);
  const setCustomProvider = useAiSettingsStore((s) => s.setCustomProvider);
  const setCustomModel = useAiSettingsStore((s) => s.setCustomModel);
  const setCustomApiKey = useAiSettingsStore((s) => s.setCustomApiKey);

  const [showKey, setShowKey] = useState(false);

  const [apiKeys, setApiKeys] = useState<
    Array<{ id: string; name: string; key_prefix: string; last_used_at: string | null; created_at: string }>
  >([]);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  useEffect(() => {
    if (!open || !isPersistenceEnabled()) return;
    fetch("/api/v1/api-keys")
      .then((r) => r.json())
      .then((d) => setApiKeys(d.keys ?? []))
      .catch(() => {});
  }, [open]);

  async function createApiKey() {
    setKeyLoading(true);
    setNewRawKey(null);
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "MCP / CLI" }),
      });
      const data = await res.json();
      if (data.key?.rawKey) {
        setNewRawKey(data.key.rawKey);
        setApiKeys((k) => [
          {
            id: data.key.id,
            name: data.key.name,
            key_prefix: data.key.prefix,
            last_used_at: null,
            created_at: new Date().toISOString(),
          },
          ...k,
        ]);
      }
    } finally {
      setKeyLoading(false);
    }
  }

  async function revokeApiKey(id: string) {
    await fetch(`/api/v1/api-keys?id=${id}`, { method: "DELETE" });
    setApiKeys((k) => k.filter((key) => key.id !== id));
  }

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
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lifted z-50 duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-12 flex items-center justify-between px-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground hover:bg-gray-50 w-7 h-7 rounded-md flex items-center justify-center text-lg leading-none"
          >
            x
          </button>
        </div>

        <div className="p-5 overflow-y-auto h-[calc(100%-3rem)] space-y-6">
          <div>
            <h3 className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
              Workspace
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs text-foreground">Suggest insights after replies</span>
                <input
                  type="checkbox"
                  checked={suggestInsights}
                  onChange={async (e) => {
                    setSuggestInsights(e.target.checked);
                    if (isPersistenceEnabled()) {
                      await workspaceApi.updateSettings({ suggestInsights: e.target.checked });
                    }
                  }}
                  className="rounded border-gray-300 text-cerulean-600"
                />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs text-foreground">Advanced mode (Graph, Exemplars)</span>
                <input
                  type="checkbox"
                  checked={advancedMode}
                  onChange={async (e) => {
                    setAdvancedMode(e.target.checked);
                    if (isPersistenceEnabled()) {
                      await workspaceApi.updateSettings({ advancedMode: e.target.checked });
                    }
                  }}
                  className="rounded border-gray-300 text-cerulean-600"
                />
              </label>
            </div>
          </div>

          {advancedMode && (
          <div>
            <h3 className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
              Background agents
            </h3>
            <div className="space-y-3">
              {agentToggles.map((toggle) => (
                <label
                  key={toggle.key}
                  className="flex items-start justify-between gap-3 cursor-pointer group"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">{toggle.label}</p>
                    <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{toggle.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={backgroundAgents[toggle.key]}
                    onChange={async () => {
                      toggleBackgroundAgent(toggle.key);
                      if (isPersistenceEnabled()) {
                        const next = !backgroundAgents[toggle.key];
                        await workspaceApi.updateSettings({ [toggle.key]: next });
                      }
                    }}
                    className="mt-0.5 rounded border-gray-300 text-cerulean-600"
                  />
                </label>
              ))}
            </div>
          </div>
          )}

          <div>
            <h3 className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
              AI Provider
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1.5">Provider</label>
                <select
                  value={customProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-cerulean-100 focus:border-cerulean-300"
                >
                  <option value="">Use server default</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Gemini</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              {customProvider && (
                <>
                  <div>
                    <label className="text-xs text-muted block mb-1.5">Model</label>
                    <select
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-cerulean-100 focus:border-cerulean-300"
                    >
                      {activeModels.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1.5">API Key</label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-14 bg-white text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cerulean-100 focus:border-cerulean-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground px-1.5 py-0.5 rounded"
                      >
                        {showKey ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div
                    className={`text-xs px-3 py-2 rounded-lg ${
                      isConfigured
                        ? "bg-success-50 text-success-700 border border-success-100"
                        : "bg-warning-50 text-warning-700 border border-warning-100"
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

          {advancedMode && isPersistenceEnabled() && (
            <div>
              <h3 className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
                MCP / CLI Access
              </h3>
              <p className="text-xs text-muted mb-3 leading-relaxed">
                Generate an API key to connect Cerulean from Cursor, Antigravity, or other MCP clients.
                Keys only access your account data.
              </p>

              {newRawKey && (
                <div className="mb-3 p-3 bg-cerulean-50 border border-cerulean-200 rounded-lg">
                  <p className="text-[10px] font-semibold text-cerulean-800 mb-1">
                    Copy this key now — it won&apos;t be shown again
                  </p>
                  <code className="text-[10px] break-all text-cerulean-700">{newRawKey}</code>
                </div>
              )}

              <button
                type="button"
                onClick={createApiKey}
                disabled={keyLoading}
                className="text-xs font-medium px-3 py-2 bg-cerulean-500 text-white rounded-lg hover:bg-cerulean-600 disabled:opacity-50 mb-3"
              >
                {keyLoading ? "Creating..." : "Generate API key"}
              </button>

              {apiKeys.length > 0 && (
                <ul className="space-y-2">
                  {apiKeys.map((k) => (
                    <li
                      key={k.id}
                      className="flex items-center justify-between text-xs border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{k.name}</p>
                        <p className="text-muted font-mono">{k.key_prefix}...</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => revokeApiKey(k.id)}
                        className="text-danger-600 hover:text-danger-700"
                      >
                        Revoke
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-[10px] text-muted leading-relaxed">
                <p className="font-semibold text-foreground mb-1">Cursor / MCP config</p>
                <pre className="whitespace-pre-wrap font-mono text-[9px]">{`{
  "mcpServers": {
    "cerulean": {
      "command": "node",
      "args": ["/path/to/Cerulean/packages/cerulean-mcp/dist/index.js"],
      "env": {
        "CERULEAN_URL": "https://your-app.railway.app",
        "CERULEAN_API_KEY": "cer_..."
      }
    }
  }
}`}</pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
