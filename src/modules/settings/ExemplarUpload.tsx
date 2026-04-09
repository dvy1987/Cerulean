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
    showToast("Exemplar added successfully");
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lifted border border-gray-200 w-full max-w-lg max-h-[85vh] flex flex-col animate-scaleIn">
          <div className="h-12 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
            <h2 className="text-sm font-semibold text-foreground">
              Exemplar Documents
            </h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground hover:bg-gray-50 w-7 h-7 rounded-md flex items-center justify-center text-lg leading-none"
            >
              x
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1">
            <h3 className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
              Upload Exemplar
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 px-4 text-xs text-muted hover:border-cerulean-300 hover:text-cerulean-600 hover:bg-cerulean-50/30 text-center"
            >
              {fileName
                ? `Selected: ${fileName}`
                : "Click to upload a file (.md, .txt)"}
            </button>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cerulean-100 focus:border-cerulean-300"
            />

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you like about this output? What should be different?"
              rows={3}
              className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cerulean-100 focus:border-cerulean-300 resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !markdown.trim()}
              className="mt-4 w-full bg-cerulean-500 text-white text-xs font-medium py-2.5 rounded-xl hover:bg-cerulean-600 hover:shadow-soft disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Exemplar
            </button>

            {exemplars.length > 0 && (
              <>
                <h3 className="text-[10px] font-semibold text-muted uppercase tracking-wider mt-6 mb-3">
                  Uploaded Exemplars
                </h3>
                <div className="space-y-2">
                  {exemplars.map((ex) => (
                    <div
                      key={ex.exemplar_id}
                      className="flex items-start justify-between gap-2 border border-gray-100 rounded-xl p-3 hover:shadow-soft"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {ex.title}
                        </p>
                        {ex.userNotes && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">
                            {ex.userNotes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeExemplar(ex.exemplar_id)}
                        className="text-xs text-muted hover:text-danger-500 hover:bg-danger-50 shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
                        title="Remove exemplar"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-14 right-4 bg-cerulean-600 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-medium z-[60] animate-toastIn">
          {toast}
        </div>
      )}
    </>
  );
}
