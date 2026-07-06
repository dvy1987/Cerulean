"use client";

import { useState } from "react";
import { useProposedInsightStore } from "@/store/proposedInsightStore";
import { useInsightStore } from "@/store/insightStore";
import { useChatStore } from "@/store/chatStore";
import { isPersistenceEnabled } from "@/lib/config";
import { workspaceApi } from "@/lib/api/workspace-client";
import {
  MEDIUM_CONFIDENCE_THRESHOLD,
  VISIBLE_CHIP_LIMIT,
} from "@/lib/insights/proposal-constants";
import { trackMetric } from "@/lib/metrics/session-metrics";

const TRAY_PULSE_KEY = "cerulean_tray_pulse_shown";

export default function ProposedInsightBar() {
  const proposals = useProposedInsightStore((s) => s.proposals);
  const dismiss = useProposedInsightStore((s) => s.dismiss);
  const dismissAll = useProposedInsightStore((s) => s.dismissAll);
  const removeProposal = useProposedInsightStore((s) => s.removeProposal);
  const addInsight = useInsightStore((s) => s.addInsight);
  const setTrayOpen = useInsightStore((s) => s.setTrayOpen);
  const conversationId = useChatStore((s) => s.conversation.conversation_id);
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  if (proposals.length === 0) return null;

  const visible = expanded ? proposals : proposals.slice(0, VISIBLE_CHIP_LIMIT);
  const hiddenCount = proposals.length - VISIBLE_CHIP_LIMIT;

  const pulseTrayOnce = () => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(TRAY_PULSE_KEY)) return;
    sessionStorage.setItem(TRAY_PULSE_KEY, "1");
    setTrayOpen(true);
  };

  const handleSave = async (
    proposalId: string,
    title: string,
    content: string,
    assistantMessageId: string
  ) => {
    const sourceMessageIds = assistantMessageId ? [assistantMessageId] : [];
    try {
      if (isPersistenceEnabled()) {
        await workspaceApi.addInsight({
          title,
          content,
          conversationId,
          sourceMessageIds,
        });
      } else {
        addInsight({ title, content, conversationId, sourceMessageIds });
      }
      trackMetric("insight_saved_proposal");
      pulseTrayOnce();
      showToast("Insight saved");
      removeProposal(proposalId);
    } catch {
      // workspaceApi surfaces errors via store; keep chip for retry
    }
  };

  return (
    <div
      className="px-4 py-2 border-t border-cerulean-100 bg-cerulean-50/60"
      data-onboarding="proposals"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-cerulean-700">
          Ideas worth saving?
        </p>
        <button
          type="button"
          onClick={dismissAll}
          className="text-[10px] text-muted hover:text-foreground"
        >
          Not now
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {visible.map((p) => {
          const isMedium =
            p.confidence !== undefined &&
            p.confidence < MEDIUM_CONFIDENCE_THRESHOLD;
          return (
            <div
              key={p.proposal_id}
              className={`flex items-center gap-1 bg-white border border-cerulean-200 rounded-lg pl-3 pr-1 py-1 shadow-soft max-w-full ${
                isMedium ? "opacity-80" : ""
              }`}
            >
              <span
                className="text-[11px] text-foreground truncate max-w-[200px]"
                title={p.content}
              >
                {p.title}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleSave(
                    p.proposal_id,
                    p.title,
                    p.content,
                    p.assistant_message_id
                  )
                }
                className="text-[10px] font-medium px-2 py-1 rounded-md bg-cerulean-600 text-white hover:bg-cerulean-700 shrink-0"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => dismiss(p.proposal_id)}
                className="text-[10px] text-muted hover:text-foreground w-6 h-6 shrink-0"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          );
        })}
        {!expanded && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-[10px] font-medium text-cerulean-700 hover:text-cerulean-800 px-2 py-1 rounded-md border border-cerulean-200 bg-white"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
      {toast && (
        <p className="text-[10px] text-cerulean-700 mt-2 animate-fadeIn">{toast}</p>
      )}
    </div>
  );
}
