"use client";

import { useState, useRef, useEffect } from "react";
import { DocumentBlock, BlockType } from "@/types";
import { runAiAction } from "@/lib/ai";
import { useDocumentStore } from "@/store/documentStore";
import { DocumentExpandResult } from "@/lib/ai/actions";
import { v4 as uuidv4 } from "uuid";

interface DocumentBlockViewProps {
  block: DocumentBlock;
  isHighlighted?: boolean;
  onUpdate: (blockId: string, content: string) => void;
  onRemove: (blockId: string) => void;
  onAddBelow: (blockId: string) => void;
}

const BLOCK_STYLES: Record<BlockType, string> = {
  heading: "text-lg font-semibold text-foreground",
  paragraph: "text-sm text-foreground leading-relaxed",
  bullet: "text-sm text-foreground leading-relaxed pl-4",
  section: "text-base font-medium text-foreground",
};

export default function DocumentBlockView({
  block,
  isHighlighted,
  onUpdate,
  onRemove,
  onAddBelow,
}: DocumentBlockViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(block.content);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setPendingPatch = useDocumentStore((s) => s.setPendingPatch);
  const documentId = useDocumentStore((s) => s.document.document_id);

  const AI_OPERATIONS = [
    { key: "expand_argument", label: "Expand argument" },
    { key: "add_example", label: "Add example" },
    { key: "add_counterpoint", label: "Add counterpoint" },
    { key: "clarify_language", label: "Clarify language" },
  ] as const;

  const handleAiExpand = async (operation: "expand_argument" | "add_example" | "add_counterpoint" | "clarify_language") => {
    setShowAiMenu(false);
    setIsAiLoading(true);
    try {
      const result = await runAiAction<DocumentExpandResult>({
        type: "document.expand",
        input: { blockId: block.block_id, operation },
      });
      if (result.success && result.data.operations.length > 0) {
        setPendingPatch({
          patch_id: uuidv4(),
          document_id: documentId,
          operations: result.data.operations,
          status: "pending",
          source_insight_id: null,
          source_text: `AI: ${operation.replace(/_/g, " ")}`,
          created_at: new Date().toISOString(),
        });
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate(block.block_id, editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSave();
    }
    if (e.key === "Escape") {
      setEditValue(block.content);
      setIsEditing(false);
    }
  };

  const bulletPrefix = block.block_type === "bullet" ? "\u2022 " : "";

  return (
    <div
      className={`group relative rounded-lg px-4 py-2.5 border-l-2 ${
        isHighlighted
          ? "bg-cerulean-50/80 border-l-cerulean-400 shadow-soft"
          : isEditing
          ? "bg-white border-l-cerulean-300 shadow-soft"
          : "border-l-transparent hover:border-l-gray-200 hover:bg-white/60"
      }`}
    >
      {isEditing ? (
        <div>
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={`w-full resize-none border-none outline-none bg-transparent ${BLOCK_STYLES[block.block_type]}`}
          />
          <p className="text-[10px] text-muted mt-1">
            Cmd+Enter to save / Esc to cancel
          </p>
        </div>
      ) : (
        <div
          onClick={() => {
            setEditValue(block.content);
            setIsEditing(true);
          }}
          className={`cursor-text ${BLOCK_STYLES[block.block_type]}`}
        >
          {bulletPrefix}
          {block.content || (
            <span className="text-muted italic">Click to edit...</span>
          )}
        </div>
      )}

      {block.linked_insights.length > 0 && (
        <div className="mt-1.5">
          <span className="text-[9px] text-cerulean-600 bg-cerulean-50 px-2 py-0.5 rounded-md font-medium">
            {block.linked_insights.length} linked insight
            {block.linked_insights.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 group-hover:opacity-100">
        <div className="relative">
          <button
            onClick={() => setShowAiMenu(!showAiMenu)}
            disabled={isAiLoading || !block.content}
            className={`px-2 py-1 text-[10px] font-medium rounded-md ${
              isAiLoading
                ? "text-cerulean-400 animate-pulse bg-cerulean-50"
                : "text-cerulean-600 hover:bg-cerulean-50"
            }`}
            title="AI expand"
          >
            AI
          </button>
          {showAiMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lifted z-20 py-1 w-44 animate-scaleIn">
              {AI_OPERATIONS.map((op) => (
                <button
                  key={op.key}
                  onClick={() => handleAiExpand(op.key)}
                  className="block w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50"
                >
                  {op.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onAddBelow(block.block_id)}
          className="px-1.5 py-1 text-muted hover:text-foreground hover:bg-gray-100 text-xs rounded-md"
          title="Add block below"
        >
          +
        </button>
        <button
          onClick={() => onRemove(block.block_id)}
          className="px-1.5 py-1 text-muted hover:text-danger-500 hover:bg-danger-50 text-xs rounded-md"
          title="Remove block"
        >
          x
        </button>
      </div>
    </div>
  );
}
