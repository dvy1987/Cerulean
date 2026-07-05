"use client";

import { useDocumentStore } from "@/store/documentStore";
import { isPersistenceEnabled } from "@/lib/config";
import { workspaceApi } from "@/lib/api/workspace-client";

export default function PatchReview() {
  const { pendingPatch, acceptPatch, rejectPatch } = useDocumentStore();

  if (!pendingPatch) return null;

  const handleAccept = async () => {
    if (isPersistenceEnabled()) {
      await workspaceApi.acceptPatch();
    } else {
      acceptPatch();
    }
  };

  const handleReject = async () => {
    if (isPersistenceEnabled()) {
      await workspaceApi.rejectPatch();
    } else {
      rejectPatch();
    }
  };

  if (!pendingPatch) return null;

  const opSummary = pendingPatch.operations
    .map((op) => {
      switch (op.type) {
        case "insert_block":
          return `Add: "${op.block?.content?.slice(0, 40)}..."`;
        case "update_block":
          return `Update block`;
        case "delete_block":
          return `Remove block`;
        default:
          return op.type;
      }
    })
    .join(", ");

  return (
    <div
      className="mx-4 mt-3 p-4 bg-gradient-to-r from-cerulean-50 to-cerulean-100/50 border border-cerulean-200 rounded-xl shadow-soft animate-slideUp"
      data-onboarding="patch-review"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-cerulean-800 mb-1">
            AI Patch Pending
          </p>
          {pendingPatch.placement_label && (
            <p className="text-[11px] text-cerulean-700 mb-1">
              Adding under: <span className="font-medium">{pendingPatch.placement_label}</span>
            </p>
          )}
          <p className="text-[11px] text-cerulean-600 line-clamp-2 font-mono leading-relaxed">
            {opSummary}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 shadow-soft"
          >
            Accept
          </button>
          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 bg-white text-danger-600 border border-danger-200 rounded-lg hover:bg-danger-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
