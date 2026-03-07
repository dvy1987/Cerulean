"use client";

import { useState, useRef, useEffect } from "react";
import { DocumentBlock, BlockType } from "@/types";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const bulletPrefix = block.block_type === "bullet" ? "• " : "";

  return (
    <div
      className={`group relative rounded-md px-3 py-2 transition-colors ${
        isHighlighted
          ? "bg-cerulean-50 border border-cerulean-200"
          : "hover:bg-gray-50"
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
            ⌘+Enter to save · Esc to cancel
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

      {/* Linked insights indicator */}
      {block.linked_insights.length > 0 && (
        <div className="mt-1">
          <span className="text-[9px] text-cerulean-500 bg-cerulean-50 px-1.5 py-0.5 rounded">
            {block.linked_insights.length} linked insight
            {block.linked_insights.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onAddBelow(block.block_id)}
          className="p-1 text-muted hover:text-foreground text-xs"
          title="Add block below"
        >
          +
        </button>
        <button
          onClick={() => onRemove(block.block_id)}
          className="p-1 text-muted hover:text-red-500 text-xs"
          title="Remove block"
        >
          ×
        </button>
      </div>
    </div>
  );
}
