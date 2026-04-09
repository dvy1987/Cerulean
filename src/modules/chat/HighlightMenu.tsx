"use client";

import { useEffect, useState, useCallback } from "react";

interface HighlightMenuProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onSaveInsight: (text: string) => void;
  onPromoteToDocument: (text: string) => void;
}

interface MenuPosition {
  x: number;
  y: number;
}

export default function HighlightMenu({
  containerRef,
  onSaveInsight,
  onPromoteToDocument,
}: HighlightMenuProps) {
  const [selectedText, setSelectedText] = useState("");
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || !containerRef.current) {
        setMenuPosition(null);
        setSelectedText("");
        return;
      }

      const range = selection?.getRangeAt(0);
      if (!range || !containerRef.current.contains(range.commonAncestorContainer)) {
        setMenuPosition(null);
        setSelectedText("");
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      setSelectedText(text);
      setMenuPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 8,
      });
    }, 10);
  }, [containerRef]);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-highlight-menu]")) {
        setMenuPosition(null);
        setSelectedText("");
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [handleMouseUp, handleMouseDown]);

  if (!menuPosition || !selectedText) return null;

  return (
    <div
      data-highlight-menu
      className="absolute z-50 flex gap-1 rounded-xl glass shadow-lifted border border-gray-200/60 p-1.5 animate-scaleIn"
      style={{
        left: menuPosition.x,
        top: menuPosition.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <button
        className="px-3.5 py-2 text-xs font-medium rounded-lg hover:bg-cerulean-50 text-cerulean-700 whitespace-nowrap"
        onClick={() => {
          onPromoteToDocument(selectedText);
          setMenuPosition(null);
          setSelectedText("");
          window.getSelection()?.removeAllRanges();
        }}
      >
        Promote to Document
      </button>
      <div className="w-px bg-gray-200 my-1" />
      <button
        className="px-3.5 py-2 text-xs font-medium rounded-lg hover:bg-warning-50 text-warning-700 whitespace-nowrap"
        onClick={() => {
          onSaveInsight(selectedText);
          setMenuPosition(null);
          setSelectedText("");
          window.getSelection()?.removeAllRanges();
        }}
      >
        Save Insight
      </button>
    </div>
  );
}
