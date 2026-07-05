"use client";

import { useState, useMemo } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { BlockType, DocumentType } from "@/types";
import DocumentBlockView from "./DocumentBlockView";
import PatchReview from "./PatchReview";
import ChangeTemplateModal from "@/components/ChangeTemplateModal";
import { DOCUMENT_TEMPLATES } from "@/lib/document-templates/registry";
import { isPersistenceEnabled } from "@/lib/config";
import { workspaceApi } from "@/lib/api/workspace-client";

const BLOCK_TYPE_OPTIONS: { value: BlockType; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading", label: "Heading" },
  { value: "section", label: "Section" },
  { value: "bullet", label: "Bullet" },
];

export default function DocumentPanel() {
  const {
    document: doc,
    blocks,
    pendingPatch,
    addBlock,
    updateBlockContent,
    removeBlock,
    setDocumentTitle,
    exportMarkdown,
    exportPlainText,
    exportPRD,
  } = useDocumentStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(doc.title);
  const [showExport, setShowExport] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [changeTarget, setChangeTarget] = useState<DocumentType | null>(null);

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.position - b.position),
    [blocks]
  );

  const patchBlockIds = useMemo(() => {
    if (!pendingPatch) return new Set<string>();
    return new Set(pendingPatch.operations.map((op) => op.block_id));
  }, [pendingPatch]);

  const handleTitleSave = async () => {
    if (isPersistenceEnabled()) {
      await workspaceApi.setDocumentTitle(titleValue);
    } else {
      setDocumentTitle(titleValue);
    }
    setIsEditingTitle(false);
  };

  const handleAddBlock = async (
    afterBlockId?: string,
    blockType: BlockType = "paragraph"
  ) => {
    let position = blocks.length;
    if (afterBlockId) {
      const afterBlock = blocks.find((b) => b.block_id === afterBlockId);
      if (afterBlock) {
        position = afterBlock.position + 0.5;
      }
    }
    if (isPersistenceEnabled()) {
      await workspaceApi.addBlock({ content: "", block_type: blockType, position });
    } else {
      addBlock({
        content: "",
        block_type: blockType,
        position,
      });
    }
    setShowAddMenu(false);
  };

  const handleUpdateBlock = async (blockId: string, content: string) => {
    if (isPersistenceEnabled()) {
      await workspaceApi.updateBlock(blockId, content);
    } else {
      updateBlockContent(blockId, content);
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    if (isPersistenceEnabled()) {
      await workspaceApi.removeBlock(blockId);
    } else {
      removeBlock(blockId);
    }
  };

  const handleExport = (format: "markdown" | "text" | "prd") => {
    let content: string;
    if (format === "prd") {
      content = exportPRD();
    } else if (format === "markdown") {
      content = exportMarkdown();
    } else {
      content = exportPlainText();
    }
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = format === "prd" ? "md" : format === "markdown" ? "md" : "txt";
    a.download = `${doc.title}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  return (
    <div className="flex flex-col h-full bg-warm-50">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-white flex items-center justify-between">
        <div className="flex-1">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setTitleValue(doc.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="text-sm font-semibold w-full border-none outline-none bg-transparent"
            />
          ) : (
            <div>
              <h2
                onClick={() => {
                  setTitleValue(doc.title);
                  setIsEditingTitle(true);
                }}
                className="text-sm font-semibold text-foreground cursor-text hover:text-cerulean-600"
              >
                {doc.title}
              </h2>
              <p className="text-[11px] text-muted mt-0.5">
                {DOCUMENT_TEMPLATES[doc.document_type]?.label ?? "Document"}
              </p>
            </div>
          )}
        </div>
        <div className="relative flex items-center gap-1">
          <button
            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
            className="text-xs text-muted hover:text-foreground hover:bg-gray-50 px-2.5 py-1.5 rounded-md"
            title="Document options"
          >
            ⋯
          </button>
          {showTemplateMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lifted z-10 py-1 min-w-[180px]">
              <p className="px-3.5 py-1 text-[10px] text-muted uppercase tracking-wider">Change template</p>
              {(["product_spec", "strategy_memo", "product_analysis", "blank"] as DocumentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setShowTemplateMenu(false);
                    setChangeTarget(type);
                  }}
                  className="block w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50"
                >
                  {DOCUMENT_TEMPLATES[type].label}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowExport(!showExport)}
            className="text-xs text-muted hover:text-foreground hover:bg-gray-50 px-2.5 py-1.5 rounded-md"
          >
            Export
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lifted z-10 py-1 min-w-[160px] animate-scaleIn">
              <button
                onClick={() => handleExport("markdown")}
                className="block w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50"
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => handleExport("text")}
                className="block w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50"
              >
                Plain Text (.txt)
              </button>
              <button
                onClick={() => handleExport("prd")}
                className="block w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50"
              >
                PRD Format (.md)
              </button>
            </div>
          )}
        </div>
      </div>

      <PatchReview />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {sortedBlocks.length === 0 && !pendingPatch && (
          <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warm-100 to-warm-200 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Your document is empty</p>
            <p className="text-xs text-muted text-center max-w-[260px] leading-relaxed">
              Promote ideas from chat or insights to start building your document.
            </p>
            <button
              onClick={() => handleAddBlock()}
              className="mt-4 text-xs font-medium text-cerulean-600 hover:text-cerulean-700 hover:bg-cerulean-50 px-3 py-1.5 rounded-lg"
            >
              + Add a block
            </button>
          </div>
        )}

        {sortedBlocks.map((block) => (
          <DocumentBlockView
            key={block.block_id}
            block={block}
            isHighlighted={patchBlockIds.has(block.block_id)}
            onUpdate={handleUpdateBlock}
            onRemove={handleRemoveBlock}
            onAddBelow={handleAddBlock}
          />
        ))}

        {sortedBlocks.length > 0 && (
          <div className="relative mt-2">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full text-left px-3 py-2.5 text-xs text-muted hover:text-cerulean-600 rounded-lg hover:bg-white/60"
            >
              + Add block
            </button>
            {showAddMenu && (
              <div className="absolute left-3 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lifted z-10 py-1 animate-scaleIn">
                {BLOCK_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAddBlock(undefined, opt.value)}
                    className="block w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <ChangeTemplateModal
        open={changeTarget !== null}
        targetType={changeTarget}
        onClose={() => setChangeTarget(null)}
      />
    </div>
  );
}
