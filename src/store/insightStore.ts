import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Insight, InsightStatus } from "@/types";

type TrayMode = "collapsed" | "open" | "fullscreen";

interface InsightState {
  insights: Insight[];
  isTrayOpen: boolean;
  trayMode: TrayMode;
  addInsight: (params: {
    title: string;
    content: string;
    conversationId?: string | null;
    sourceMessageIds?: string[];
  }) => Insight;
  updateInsight: (insightId: string, updates: Partial<Insight>) => void;
  setInsightStatus: (insightId: string, status: InsightStatus) => void;
  setInsightScores: (insightId: string, relevance: number, maturity: number) => void;
  archiveInsight: (insightId: string) => void;
  toggleTray: () => void;
  setTrayOpen: (open: boolean) => void;
  setTrayMode: (mode: TrayMode) => void;
  cycleTrayMode: () => void;
  getActiveInsights: () => Insight[];
}

export const useInsightStore = create<InsightState>((set, get) => ({
  insights: [],
  isTrayOpen: false,
  trayMode: "collapsed" as TrayMode,

  addInsight: ({ title, content, conversationId = null, sourceMessageIds = [] }) => {
    const now = new Date().toISOString();
    const insight: Insight = {
      insight_id: uuidv4(),
      title,
      summary: content.slice(0, 120),
      content,
      status: "captured",
      priority: get().insights.length,
      relevance: 0,
      maturity: 0,
      conversation_id: conversationId,
      source_message_ids: sourceMessageIds,
      created_at: now,
      updated_at: now,
    };
    set((state) => ({
      insights: [...state.insights, insight],
      isTrayOpen: true,
    }));
    return insight;
  },

  updateInsight: (insightId, updates) => {
    set((state) => ({
      insights: state.insights.map((i) =>
        i.insight_id === insightId
          ? { ...i, ...updates, updated_at: new Date().toISOString() }
          : i
      ),
    }));
  },

  setInsightStatus: (insightId, status) => {
    set((state) => ({
      insights: state.insights.map((i) =>
        i.insight_id === insightId
          ? { ...i, status, updated_at: new Date().toISOString() }
          : i
      ),
    }));
  },

  setInsightScores: (insightId, relevance, maturity) => {
    set((state) => ({
      insights: state.insights.map((i) =>
        i.insight_id === insightId
          ? { ...i, relevance, maturity, updated_at: new Date().toISOString() }
          : i
      ),
    }));
  },

  archiveInsight: (insightId) => {
    get().setInsightStatus(insightId, "archived");
  },

  toggleTray: () =>
    set((state) => {
      const next = state.trayMode === "collapsed" ? "open" : "collapsed";
      return { isTrayOpen: next !== "collapsed", trayMode: next };
    }),

  setTrayOpen: (open) =>
    set({ isTrayOpen: open, trayMode: open ? "open" : "collapsed" }),

  setTrayMode: (mode) =>
    set({ trayMode: mode, isTrayOpen: mode !== "collapsed" }),

  cycleTrayMode: () =>
    set((state) => {
      const order: TrayMode[] = ["collapsed", "open", "fullscreen"];
      const idx = order.indexOf(state.trayMode);
      const next = order[(idx + 1) % order.length];
      return { trayMode: next, isTrayOpen: next !== "collapsed" };
    }),

  getActiveInsights: () =>
    get().insights.filter((i) => i.status !== "archived"),
}));
