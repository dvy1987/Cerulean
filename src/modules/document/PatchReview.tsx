"use client";

import { useDocumentStore } from "@/store/documentStore";

export default function PatchReview() {
  const { pendingPatch, acceptPatch, rejectPatch } = useDocumentStore();

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
    <div className="mx-3 mb-3 p-3 bg-cerulean-50 border border-cerulean-200 rounded-lg">
      <p className="text-xs font-medium text-cerulean-800 mb-1">
        AI Patch Pending
      </p>
      <p className="text-[11px] text-cerulean-600 mb-2 line-clamp-2">
        {opSummary}
      </p>
      <div className="flex gap-2">
        <button
          onClick={acceptPatch}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          <span>✓</span> Accept
        </button>
        <button
          onClick={rejectPatch}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          <span>✕</span> Reject
        </button>
      </div>
    </div>
  );
}
