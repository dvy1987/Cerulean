"use client";

import { useState } from "react";
import type { DocumentType } from "@/types";
import { DOCUMENT_TEMPLATES, DEFAULT_DOCUMENT_TYPE } from "@/lib/document-templates/registry";
import { isPersistenceEnabled } from "@/lib/config";
import { workspaceApi } from "@/lib/api/workspace-client";
import { useDocumentStore } from "@/store/documentStore";
import { useAiSettingsStore } from "@/store/aiSettingsStore";

const OPTIONS: DocumentType[] = [
  "product_spec",
  "strategy_memo",
  "product_analysis",
  "blank",
];

interface DocumentTypePickerProps {
  open: boolean;
  onClose: () => void;
}

export default function DocumentTypePicker({ open, onClose }: DocumentTypePickerProps) {
  const [selected, setSelected] = useState<DocumentType>(DEFAULT_DOCUMENT_TYPE);
  const [loading, setLoading] = useState(false);
  const applyTemplate = useDocumentStore((s) => s.applyTemplate);
  const setHasChosenTemplate = useAiSettingsStore((s) => s.setHasChosenTemplate);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (isPersistenceEnabled()) {
        await workspaceApi.applyDocumentType(selected);
      } else {
        applyTemplate(selected);
        setHasChosenTemplate(true);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-xl shadow-medium max-w-md w-full p-6 animate-fadeIn">
        <h2 className="text-sm font-semibold text-foreground mb-1">Choose document type</h2>
        <p className="text-xs text-muted mb-4">
          Start with a structure that matches how you think. Default is Product Spec.
        </p>
        <div className="space-y-2 mb-6">
          {OPTIONS.map((type) => {
            const t = DOCUMENT_TEMPLATES[type];
            return (
              <label
                key={type}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected === type
                    ? "border-cerulean-400 bg-cerulean-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="documentType"
                  checked={selected === type}
                  onChange={() => setSelected(type)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-[11px] text-muted">
                    {t.sections.length > 0
                      ? `${t.sections.length} sections: ${t.sections.slice(0, 3).join(", ")}…`
                      : "Empty document, no headings"}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-muted hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="text-xs px-4 py-2 rounded-lg bg-cerulean-600 text-white hover:bg-cerulean-700 disabled:opacity-50"
          >
            {loading ? "Applying…" : "Start with template"}
          </button>
        </div>
      </div>
    </div>
  );
}
