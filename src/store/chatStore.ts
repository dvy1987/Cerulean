import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Message, Conversation } from "@/types";

interface ChatState {
  conversation: Conversation;
  messages: Message[];
  isStreaming: boolean;
  addMessage: (role: Message["role"], content: string) => Message;
  updateMessage: (messageId: string, content: string) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

const createConversation = (): Conversation => ({
  conversation_id: uuidv4(),
  title: "New Conversation",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const useChatStore = create<ChatState>((set, get) => ({
  conversation: createConversation(),
  messages: [],
  isStreaming: false,

  addMessage: (role, content) => {
    const message: Message = {
      message_id: uuidv4(),
      conversation_id: get().conversation.conversation_id,
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, message],
    }));
    return message;
  },

  updateMessage: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.message_id === messageId ? { ...m, content } : m
      ),
    }));
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  clearMessages: () =>
    set({
      conversation: createConversation(),
      messages: [],
    }),
}));
