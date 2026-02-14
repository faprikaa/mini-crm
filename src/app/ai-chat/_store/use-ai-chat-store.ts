"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "../_components/chat-bubble";

const introMessage: ChatMessage = {
  id: "intro",
  role: "assistant",
  content:
    "Halo Mimi! Aku siap bantu analisis promo dan customer dari data CRM kamu. Coba tanya strategi promo minggu ini.",
};

type AIChatStore = {
  messages: ChatMessage[];
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
};

export const useAIChatStore = create<AIChatStore>()(
  persist(
    (set) => ({
      messages: [introMessage],
      addUserMessage: (content) => {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: `u-${Date.now()}`,
              role: "user",
              content,
            },
          ],
        }));
      },
      addAssistantMessage: (content) => {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              content,
            },
          ],
        }));
      },
    }),
    {
      name: "ai-chat-storage",
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
