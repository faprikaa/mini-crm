"use client";

import { Bot, UserRound } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatBubbleProps = {
  message: ChatMessage;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  return (
    <div
      className={`flex ${
        message.role === "assistant" ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-base border-2 border-border px-3 py-2 shadow-shadow ${
          message.role === "assistant"
            ? "bg-background"
            : "bg-main text-main-foreground"
        }`}
      >
        <p className="mb-1 inline-flex items-center gap-1 text-xs font-heading">
          {message.role === "assistant" ? (
            <>
              <Bot className="h-3 w-3" />
              AI Assistant
            </>
          ) : (
            <>
              <UserRound className="h-3 w-3" />
              Mimi
            </>
          )}
        </p>
        <p className="font-base text-sm">{message.content}</p>
      </div>
    </div>
  );
}

export type { ChatMessage };
