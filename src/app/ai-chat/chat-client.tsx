"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { ChatBubble, type ChatMessage } from "./_components/chat-bubble";
import { ChatInput } from "./_components/chat-input";
import { QuickReplies } from "./_components/quick-replies";

const quickReplies: Record<string, string> = {
  "promo minggu ini":
    "Berdasarkan data simulasi saat ini, 3 kampanye teratas: Caramel Week, Pastry + Coffee Bundle, dan Weekend Oat Milk Special.",
  "siapa target caramel week":
    "Target Caramel Week adalah pelanggan dengan minat sweet drinks atau caramel. Cocok dikirim saat morning rush.",
  "buat pesan singkat":
    "Hi! Ada promo spesial minggu ini: Caramel Cold Brew diskon 10% sampai Minggu. Mau aku reservasiin buat kamu?",
};

export function AIChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "Halo Mimi! Ini prototype AI Chatbot (frontend only). Kamu bisa tanya tentang promo, segment, atau contoh pesan.",
    },
  ]);
  const [draft, setDraft] = useState("");

  function submitMessage(content: string) {
    const normalized = content.trim();
    if (!normalized) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: normalized,
    };

    const key = normalized.toLowerCase();
    const assistantContent =
      quickReplies[key] ??
      "Noted. Pada versi final, jawaban ini akan dihasilkan dari data customer dan riwayat campaign secara real-time.";

    const botMessage: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      content: assistantContent,
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setDraft("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Chatbot"
        description="Prototype frontend chatbot yang meniru percakapan berbasis data customer."
      />

      <Card className="border-2 border-border shadow-shadow">
        <CardHeader className="space-y-3">
          <CardTitle className="text-xl">Global Promo Assistant</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-2 border-border bg-main text-main-foreground">
              Frontend Prototype
            </Badge>
            <Badge className="border-2 border-border bg-secondary-background">
              Belum terhubung LLM/backend
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[340px] rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow">
            <div className="space-y-3">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </div>
          </ScrollArea>

          <QuickReplies
            prompts={Object.keys(quickReplies)}
            onSelect={submitMessage}
          />

          <ChatInput
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={() => submitMessage(draft)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
