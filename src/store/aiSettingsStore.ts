import { create } from "zustand";

interface BackgroundAgentToggles {
  knowledgeGraph: boolean;
  ranking: boolean;
  suggestion: boolean;
  tonalAdjustment: boolean;
}

export type CustomAiProvider = "anthropic" | "openai" | "gemini" | "";

interface AiSettingsState {
  backgroundAgents: BackgroundAgentToggles;
  toggleBackgroundAgent: (key: keyof BackgroundAgentToggles) => void;
  setBackgroundAgent: (key: keyof BackgroundAgentToggles, value: boolean) => void;

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
