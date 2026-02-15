"use client";

import { Bot, UserRound } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
        {message.role === "assistant" ? (
          <div className="prose prose-sm max-w-none font-base text-sm [&_pre]:overflow-x-auto [&_pre]:rounded-base [&_pre]:border [&_pre]:border-border [&_pre]:bg-secondary-background [&_pre]:p-2 [&_code]:rounded [&_code]:bg-secondary-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-main [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-main [&_blockquote]:pl-3 [&_blockquote]:italic">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="font-base text-sm">{message.content}</p>
        )}
      </div>
    </div>
  );
}

export type { ChatMessage };
