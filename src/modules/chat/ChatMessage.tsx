"use client";

import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 animate-fadeIn`}>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-cerulean-500 text-white shadow-soft"
            : "bg-white text-foreground shadow-soft border-l-2 border-cerulean-200"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
