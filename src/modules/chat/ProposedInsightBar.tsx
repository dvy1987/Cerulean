"use client";

import { useProposedInsightStore } from "@/store/proposedInsightStore";
import { useInsightStore } from "@/store/insightStore";
import { useChatStore } from "@/store/chatStore";
import { isPersistenceEnabled } from "@/lib/config";
import { workspaceApi } from "@/lib/api/workspace-client";

export default function ProposedInsightBar() {
  const proposals = useProposedInsightStore((s) => s.proposals);
  const dismiss = useProposedInsightStore((s) => s.dismiss);
  const dismissAll = useProposedInsightStore((s) => s.dismissAll);
  const removeProposal = useProposedInsightStore((s) => s.removeProposal);
  const addInsight = useInsightStore((s) => s.addInsight);
  const conversationId = useChatStore((s) => s.conversation.conversation_id);

  if (proposals.length === 0) return null;

  const handleSave = async (proposalId: string, title: string, content: string) => {
    if (isPersistenceEnabled()) {
      await workspaceApi.addInsight({
        title,
        content,
        conversationId,
      });
    } else {
      addInsight({ title, content, conversationId, sourceMessageIds: [] });
    }
    removeProposal(proposalId);
  };

  return (
    <div className="px-4 py-2 border-t border-cerulean-100 bg-cerulean-50/60" data-onboarding="proposals">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-cerulean-700">
          Save as insight?
        </p>
        <button
          type="button"
          onClick={dismissAll}
          className="text-[10px] text-muted hover:text-foreground"
        >
          Dismiss all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {proposals.map((p) => (
          <div
            key={p.proposal_id}
            className="flex items-center gap-1 bg-white border border-cerulean-200 rounded-lg pl-3 pr-1 py-1 shadow-soft max-w-full"
          >
            <span className="text-[11px] text-foreground truncate max-w-[200px]" title={p.content}>
              {p.title}
            </span>
            <button
              type="button"
              onClick={() => handleSave(p.proposal_id, p.title, p.content)}
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
        ))}
      </div>
    </div>
  );
}
