"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

export default function ChatInput({ onSend, disabled, initialValue }: ChatInputProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 bg-white">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm
            focus:outline-none focus:border-cerulean-300 focus:ring-2 focus:ring-cerulean-100
            focus:shadow-soft disabled:opacity-50 bg-gray-50/50 placeholder:text-gray-400"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="rounded-xl bg-cerulean-500 px-5 py-2.5 text-sm font-medium text-white
            hover:bg-cerulean-600 hover:shadow-soft active:scale-[0.98]
            disabled:opacity-40 disabled:hover:shadow-none shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}
