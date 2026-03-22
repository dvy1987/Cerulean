import { create } from "zustand";

interface BackgroundAgentToggles {
  knowledgeGraph: boolean;
  ranking: boolean;
  suggestion: boolean;
  tonalAdjustment: boolean;
}

interface AiSettingsState {
  backgroundAgents: BackgroundAgentToggles;
  toggleBackgroundAgent: (key: keyof BackgroundAgentToggles) => void;
  setBackgroundAgent: (key: keyof BackgroundAgentToggles, value: boolean) => void;
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
}));
