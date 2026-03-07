"use client";

import { useState, useMemo } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { BlockType } from "@/types";
import DocumentBlockView from "./DocumentBlockView";
import PatchReview from "./PatchReview";

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

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.position - b.position),
    [blocks]
  );

  // Track which block IDs are affected by pending patch
  const patchBlockIds = useMemo(() => {
    if (!pendingPatch) return new Set<string>();
    return new Set(pendingPatch.operations.map((op) => op.block_id));
  }, [pendingPatch]);

  const handleTitleSave = () => {
    setDocumentTitle(titleValue);
    setIsEditingTitle(false);
  };

  const handleAddBlock = (afterBlockId?: string, blockType: BlockType = "paragraph") => {
    let position = blocks.length;
    if (afterBlockId) {
      const afterBlock = blocks.find((b) => b.block_id === afterBlockId);
      if (afterBlock) {
        position = afterBlock.position + 0.5;
      }
    }
    addBlock({
      content: "",
      block_type: blockType,
      position,
    });
    setShowAddMenu(false);
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
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
              className="text-sm font-medium w-full border-none outline-none bg-transparent"
            />
          ) : (
            <div>
              <h2
                onClick={() => {
                  setTitleValue(doc.title);
                  setIsEditingTitle(true);
                }}
                className="text-sm font-medium text-foreground cursor-text hover:text-cerulean-600 transition-colors"
              >
                {doc.title}
              </h2>
              <p className="text-xs text-muted">Structured document</p>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExport(!showExport)}
            className="text-xs text-muted hover:text-foreground px-2 py-1 rounded transition-colors"
          >
            Export
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1">
              <button
                onClick={() => handleExport("markdown")}
                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => handleExport("text")}
                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                Plain Text (.txt)
              </button>
              <button
                onClick={() => handleExport("prd")}
                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                PRD Format (.md)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Patch review banner */}
      <PatchReview />

      {/* Document blocks */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {sortedBlocks.length === 0 && !pendingPatch && (
          <div className="flex flex-col items-center justify-center h-full text-muted text-sm">
            <p>Your document is empty</p>
            <p className="text-xs mt-1">
              Promote ideas from chat or insights to start building
            </p>
            <button
              onClick={() => handleAddBlock()}
              className="mt-3 text-xs text-cerulean-600 hover:text-cerulean-700"
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
            onUpdate={updateBlockContent}
            onRemove={removeBlock}
            onAddBelow={handleAddBlock}
          />
        ))}

        {sortedBlocks.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full text-left px-3 py-2 text-xs text-muted hover:text-cerulean-600 transition-colors"
            >
              + Add block
            </button>
            {showAddMenu && (
              <div className="absolute left-3 bottom-full mb-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1">
                {BLOCK_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAddBlock(undefined, opt.value)}
                    className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
