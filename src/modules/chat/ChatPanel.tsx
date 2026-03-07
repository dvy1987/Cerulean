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

export default function ChatPanel() {
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

  // Listen for insight-to-prompt events
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

    // Create placeholder for assistant message
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
    showToast("✓ Insight saved");
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
    showToast("Patch created — review in document");
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-medium text-foreground">Chat</h2>
        <p className="text-xs text-muted">Explore ideas with AI</p>
      </div>

      {/* Messages */}
      <div ref={messageListRef} className="flex-1 overflow-y-auto px-4 py-4 relative">
        <HighlightMenu
          containerRef={messageListRef}
          onSaveInsight={handleSaveInsight}
          onPromoteToDocument={handlePromoteToDocument}
        />
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            Start a conversation to explore ideas
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.message_id} message={msg} />
        ))}
        {isStreaming && (
          <div className="flex justify-start mb-3">
            <div className="text-xs text-muted animate-pulse">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-cerulean-600 text-white text-xs px-3 py-1.5 rounded-full shadow-md animate-pulse z-50">
          {toast}
        </div>
      )}

      {/* Thinking Suggestions */}
      <ThinkingSuggestions
        onSelectSuggestion={(text) => setChatPrompt(text)}
        onSaveAsInsight={(text) => {
          addInsight({
            title: text.slice(0, 60),
            content: text,
            conversationId: conversation.conversation_id,
          });
          showToast("✓ Insight saved");
        }}
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isStreaming}
        initialValue={chatPrompt}
      />
    </div>
  );
}
