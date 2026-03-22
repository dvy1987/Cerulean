"use client";

import { useRef, useState } from "react";
import { useMemoryStore } from "@/store/memoryStore";

interface ExemplarUploadProps {
  open: boolean;
  onClose: () => void;
}

export default function ExemplarUpload({ open, onClose }: ExemplarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addExemplar = useMemoryStore((s) => s.addExemplar);
  const exemplars = useMemoryStore((s) => s.exemplars);
  const removeExemplar = useMemoryStore((s) => s.removeExemplar);

  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (![".md", ".txt"].includes(ext)) {
      showToast("Unsupported format. Use .md or .txt files.");
      return;
    }

    try {
      const text = await file.text();
      setMarkdown(text);
      setFileName(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.(md|txt)$/i, ""));
      }
    } catch {
      showToast("Failed to read file.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !markdown.trim()) {
      showToast("Title and content are required.");
      return;
    }

    addExemplar({
      title: title.trim(),
      markdown: markdown.trim(),
      userNotes: notes.trim(),
    });

    setTitle("");
    setMarkdown("");
    setNotes("");
    setFileName(null);
    showToast("✓ Exemplar added successfully");
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-lg max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="h-11 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
            <h2 className="text-sm font-semibold text-cerulean-700">
              Exemplar Documents
            </h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground text-lg leading-none transition-colors"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            {/* Upload section */}
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
              Upload Exemplar
            </h3>

            {/* File upload area */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-dashed border-gray-300 rounded-md py-3 px-4 text-xs text-muted hover:border-cerulean-400 hover:text-cerulean-600 transition-colors text-center"
            >
              {fileName
                ? `Selected: ${fileName}`
                : "Click to upload a file (.md, .txt)"}
            </button>

            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="mt-3 w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-cerulean-400"
            />

            {/* Notes */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you like about this output? What should be different?"
              rows={3}
              className="mt-3 w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-cerulean-400 resize-none"
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !markdown.trim()}
              className="mt-3 w-full bg-cerulean-500 text-white text-xs font-medium py-1.5 rounded-md hover:bg-cerulean-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add Exemplar
            </button>

            {/* Existing exemplars */}
            {exemplars.length > 0 && (
              <>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wide mt-6 mb-3">
                  Uploaded Exemplars
                </h3>
                <div className="space-y-2">
                  {exemplars.map((ex) => (
                    <div
                      key={ex.exemplar_id}
                      className="flex items-start justify-between gap-2 border border-gray-100 rounded-md p-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {ex.title}
                        </p>
                        {ex.userNotes && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-2">
                            {ex.userNotes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeExemplar(ex.exemplar_id)}
                        className="text-xs text-muted hover:text-red-500 shrink-0 transition-colors"
                        title="Remove exemplar"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-14 right-4 bg-cerulean-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-md z-[60] animate-pulse">
          {toast}
        </div>
      )}
    </>
  );
}
