"use client";

import { useRef, useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useInsightStore } from "@/store/insightStore";
import { useDocumentStore } from "@/store/documentStore";
import { streamChatResponse, generatePromotionPatch } from "@/lib/ai";
import { v4 as uuidv4 } from "uuid";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import HighlightMenu from "./HighlightMenu";
import ThinkingSuggestions from "./ThinkingSuggestions";

interface ChatPanelProps {
  onHeaderDoubleClick?: () => void;
}

export default function ChatPanel({ onHeaderDoubleClick }: ChatPanelProps) {
  const {
    messages,
    isStreaming,
    addMessage,
    updateMessage,
    setStreaming,
    conversation,
  } = useChatStore();
  const addInsight = useInsightStore((s) => s.addInsight);
  const { blocks, setPendingPatch } = useDocumentStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      setChatPrompt(e.detail);
    };
    window.addEventListener("insight-to-prompt" as string, handler as EventListener);
    return () =>
      window.removeEventListener("insight-to-prompt" as string, handler as EventListener);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSend = async (content: string) => {
    setChatPrompt(undefined);
    addMessage("user", content);
    setStreaming(true);

    const assistantMsg = addMessage("assistant", "");

    let accumulated = "";
    await streamChatResponse(
      content,
      (chunk) => {
        accumulated += chunk;
        updateMessage(assistantMsg.message_id, accumulated);
      },
      () => {
        setStreaming(false);
      }
    );
  };

  const handleSaveInsight = (text: string) => {
    addInsight({
      title: text.slice(0, 60) + (text.length > 60 ? "..." : ""),
      content: text,
      conversationId: conversation.conversation_id,
      sourceMessageIds: [],
    });
    showToast("Insight saved");
  };

  const handlePromoteToDocument = (text: string) => {
    const operations = generatePromotionPatch(text, blocks, null, []);
    const patch = {
      patch_id: uuidv4(),
      document_id: useDocumentStore.getState().document.document_id,
      operations,
      status: "pending" as const,
      source_insight_id: null,
      source_text: text,
      created_at: new Date().toISOString(),
    };
    setPendingPatch(patch);
    showToast("Patch created -- review in document");
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div
        className="px-5 py-3.5 border-b border-gray-100 bg-white cursor-default select-none"
        onDoubleClick={onHeaderDoubleClick}
      >
        <h2 className="text-sm font-semibold text-foreground">Chat</h2>
        <p className="text-[11px] text-muted mt-0.5">Explore ideas with AI</p>
      </div>

      <div ref={messageListRef} className="flex-1 overflow-y-auto px-5 py-5 relative">
        <HighlightMenu
          containerRef={messageListRef}
          onSaveInsight={handleSaveInsight}
          onPromoteToDocument={handlePromoteToDocument}
        />
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cerulean-100 to-cerulean-200 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cerulean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Start a conversation</p>
            <p className="text-xs text-muted text-center max-w-[240px] leading-relaxed">
              Explore ideas with AI, then highlight text to save insights or promote to your document.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.message_id} message={msg} />
        ))}
        {isStreaming && (
          <div className="flex justify-start mb-3">
            <div className="text-xs text-muted animate-pulse px-4 py-2">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {toast && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-cerulean-600 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-medium animate-toastIn z-50">
          {toast}
        </div>
      )}

      <ThinkingSuggestions
        onSelectSuggestion={(text) => setChatPrompt(text)}
        onSaveAsInsight={(text) => {
          addInsight({
            title: text.slice(0, 60),
            content: text,
            conversationId: conversation.conversation_id,
          });
          showToast("Insight saved");
        }}
      />

      <ChatInput
        onSend={handleSend}
        disabled={isStreaming}
        initialValue={chatPrompt}
      />
    </div>
  );
}
