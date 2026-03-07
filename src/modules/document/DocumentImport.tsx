"use client";

import { useRef, useState } from "react";
import { useInsightStore } from "@/store/insightStore";
import { extractInsightsFromText } from "@/lib/ai";

export default function DocumentImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addInsight = useInsightStore((s) => s.addInsight);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "text/plain",
      "text/markdown",
      "application/octet-stream",
    ];
    const validExtensions = [".md", ".txt", ".markdown"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      showToast("Unsupported format. Use .md or .txt files.");
      return;
    }

    try {
      const text = await file.text();
      const extracted = extractInsightsFromText(text);

      if (extracted.length === 0) {
        showToast("No insights could be extracted from this file.");
        return;
      }

      for (const item of extracted) {
        addInsight({
          title: item.title,
          content: item.content,
        });
      }

      showToast(`✓ ${extracted.length} insight${extracted.length > 1 ? "s" : ""} extracted from ${file.name}`);
    } catch {
      showToast("Failed to read file.");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.markdown"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="text-xs text-muted hover:text-foreground px-2 py-1 rounded transition-colors"
        title="Import document (.md, .txt)"
      >
        Import
      </button>
      {toast && (
        <div className="fixed top-14 right-4 bg-cerulean-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-md z-50 animate-pulse">
          {toast}
        </div>
      )}
    </>
  );
}
