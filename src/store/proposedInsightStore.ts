import { create } from "zustand";
import type { ProposedInsight } from "@/types";
import { MAX_PROPOSALS } from "@/lib/insights/proposal-constants";

const DISMISS_KEY = "cerulean_dismissed_proposals";

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(ids)));
}

interface ProposedInsightState {
  proposals: ProposedInsight[];
  assistantMessageId: string | null;
  dismissedIds: Set<string>;
  setProposals: (proposals: ProposedInsight[], assistantMessageId: string) => void;
  dismiss: (proposalId: string) => void;
  dismissAll: () => void;
  removeProposal: (proposalId: string) => void;
  visibleProposals: () => ProposedInsight[];
}

export const useProposedInsightStore = create<ProposedInsightState>((set, get) => ({
  proposals: [],
  assistantMessageId: null,
  dismissedIds: loadDismissed(),

  setProposals: (proposals, assistantMessageId) => {
    const dismissed = get().dismissedIds;
    const existingTitles = new Set(
      proposals.map((p) => p.title.toLowerCase().trim())
    );
    const deduped = proposals.filter(
      (p, i, arr) =>
        arr.findIndex((x) => x.title.toLowerCase() === p.title.toLowerCase()) === i
    );
    const filtered = deduped.filter(
      (p) => !dismissed.has(p.proposal_id) && p.title.trim().length > 0
    );
    void existingTitles;
    set({ proposals: filtered.slice(0, MAX_PROPOSALS), assistantMessageId });
  },

  dismiss: (proposalId) => {
    const dismissed = new Set(get().dismissedIds);
    dismissed.add(proposalId);
    saveDismissed(dismissed);
    set({
      dismissedIds: dismissed,
      proposals: get().proposals.filter((p) => p.proposal_id !== proposalId),
    });
  },

  dismissAll: () => {
    const dismissed = new Set(get().dismissedIds);
    for (const p of get().proposals) dismissed.add(p.proposal_id);
    saveDismissed(dismissed);
    set({ proposals: [], dismissedIds: dismissed });
  },

  removeProposal: (proposalId) => {
    set({ proposals: get().proposals.filter((p) => p.proposal_id !== proposalId) });
  },

  visibleProposals: () => get().proposals,
}));
