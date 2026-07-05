import { create } from "zustand";

interface BackgroundAgentToggles {
  knowledgeGraph: boolean;
  ranking: boolean;
  suggestion: boolean;
  tonalAdjustment: boolean;
}

export type CustomAiProvider = "anthropic" | "openai" | "gemini" | "openrouter" | "";

interface AiSettingsState {
  backgroundAgents: BackgroundAgentToggles;
  suggestInsights: boolean;
  advancedMode: boolean;
  hasChosenTemplate: boolean;
  toggleBackgroundAgent: (key: keyof BackgroundAgentToggles) => void;
  setBackgroundAgent: (key: keyof BackgroundAgentToggles, value: boolean) => void;
  setSuggestInsights: (value: boolean) => void;
  setAdvancedMode: (value: boolean) => void;
  setHasChosenTemplate: (value: boolean) => void;

  customProvider: CustomAiProvider;
  customModel: string;
  customApiKey: string;
  setCustomProvider: (provider: CustomAiProvider) => void;
  setCustomModel: (model: string) => void;
  setCustomApiKey: (key: string) => void;
}

export const useAiSettingsStore = create<AiSettingsState>((set) => ({
  backgroundAgents: {
    knowledgeGraph: true,
    ranking: true,
    suggestion: true,
    tonalAdjustment: true,
  },
  suggestInsights: true,
  advancedMode: false,
  hasChosenTemplate: false,

  setSuggestInsights: (value) => set({ suggestInsights: value }),
  setAdvancedMode: (value) => set({ advancedMode: value }),
  setHasChosenTemplate: (value) => set({ hasChosenTemplate: value }),

  toggleBackgroundAgent: (key) =>
    set((state) => ({
      backgroundAgents: {
        ...state.backgroundAgents,
        [key]: !state.backgroundAgents[key],
      },
    })),

  setBackgroundAgent: (key, value) =>
    set((state) => ({
      backgroundAgents: {
        ...state.backgroundAgents,
        [key]: value,
      },
    })),

  customProvider: "",
  customModel: "",
  customApiKey: "",
  setCustomProvider: (provider) => set({ customProvider: provider }),
  setCustomModel: (model) => set({ customModel: model }),
  setCustomApiKey: (key) => set({ customApiKey: key }),
}));
