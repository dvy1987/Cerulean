"use client";

import { useState } from "react";
import type { DocumentType } from "@/types";
import { DOCUMENT_TEMPLATES } from "@/lib/document-templates/registry";
import { isPersistenceEnabled } from "@/lib/config";
import { workspaceApi } from "@/lib/api/workspace-client";
import { useDocumentStore } from "@/store/documentStore";

interface ChangeTemplateModalProps {
  open: boolean;
  targetType: DocumentType | null;
  onClose: () => void;
}

export default function ChangeTemplateModal({
  open,
  targetType,
  onClose,
}: ChangeTemplateModalProps) {
  const [preview, setPreview] = useState<{
    summary: string;
    carryoverCount: number;
    newHeadings: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const changeTemplate = useDocumentStore((s) => s.changeTemplate);
  const blocks = useDocumentStore((s) => s.blocks);

  const hasContent = blocks.some(
    (b) =>
      b.block_type !== "heading" &&
      b.block_type !== "section" &&
      b.content.trim().length > 0
  );

  if (!open || !targetType) return null;

  const template = DOCUMENT_TEMPLATES[targetType];

  const loadPreview = async () => {
    if (!hasContent) return;
    if (isPersistenceEnabled()) {
      const data = await workspaceApi.previewTemplateChange(targetType);
      setPreview(data);
    } else {
      const { previewTemplateChange } = await import("@/lib/document-templates/change-template");
      setPreview(previewTemplateChange(blocks, targetType));
    }
  };

  if (hasContent && !preview) {
    void loadPreview();
  }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (isPersistenceEnabled()) {
        await workspaceApi.changeDocumentTemplate(targetType);
      } else {
        changeTemplate(targetType);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-xl shadow-medium max-w-md w-full p-6">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Change to {template.label}?
        </h2>
        <ul className="text-xs text-muted space-y-1 mb-4 list-disc pl-4">
          <li>Keep all your written content</li>
          <li>Add new section headings where missing</li>
          {hasContent && (
            <li>Content in sections that don&apos;t exist moves to &quot;Carryover&quot;</li>
          )}
        </ul>
        {preview && (
          <p className="text-[11px] text-cerulean-700 bg-cerulean-50 rounded-lg p-3 mb-4">
            {preview.summary}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="text-xs px-4 py-2 rounded-lg bg-cerulean-600 text-white hover:bg-cerulean-700 disabled:opacity-50"
          >
            {loading ? "Changing…" : "Change template"}
          </button>
        </div>
      </div>
    </div>
  );
}
