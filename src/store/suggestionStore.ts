import { create } from "zustand";
import type { ThinkingSuggestion } from "@/types";

interface SuggestionState {
  suggestions: ThinkingSuggestion[];
  updatedAt: string | null;
  setSuggestions: (suggestions: ThinkingSuggestion[]) => void;
  clearSuggestions: () => void;
}

export const useSuggestionStore = create<SuggestionState>((set) => ({
  suggestions: [],
  updatedAt: null,
  setSuggestions: (suggestions) =>
    set({ suggestions, updatedAt: new Date().toISOString() }),
  clearSuggestions: () => set({ suggestions: [], updatedAt: null }),
}));
