import { create } from "zustand";
import type { Contradiction } from "@/types";

interface ContradictionState {
  contradictions: Contradiction[];
  setContradictions: (contradictions: Contradiction[]) => void;
  clearContradictions: () => void;
}

export const useContradictionStore = create<ContradictionState>((set) => ({
  contradictions: [],

  setContradictions: (contradictions) => set({ contradictions }),

  clearContradictions: () => set({ contradictions: [] }),
}));
