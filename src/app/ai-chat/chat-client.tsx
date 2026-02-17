"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { FlaskConical, Trash2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatBubble } from "./_components/chat-bubble";
import { ChatInput } from "./_components/chat-input";
import { QuickReplies } from "./_components/quick-replies";
import { useAIChatStore } from "./_store/use-ai-chat-store";

const quickReplies: Record<string, string> = {
  "promo minggu ini":
    "Berdasarkan data simulasi saat ini, 3 kampanye teratas: Caramel Week, Pastry + Coffee Bundle, dan Weekend Oat Milk Special.",
  "siapa target caramel week":
    "Target Caramel Week adalah pelanggan dengan minat sweet drinks atau caramel. Cocok dikirim saat morning rush.",
  "buat pesan singkat":
    "Hi! Ada promo spesial minggu ini: Caramel Cold Brew diskon 10% sampai Minggu. Mau aku reservasiin buat kamu?",
};

const testRequestPrompt =
  "Ini test request LangChain SQL agent. Tolong cek koneksi AI + database, lalu balas singkat status koneksi saat ini.";

export function AIChatClient({
  aiBaseUrl,
  aiModel,
}: {
  aiBaseUrl: string;
  aiModel: string;
}) {
  const messages = useAIChatStore((state) => state.messages);
  const addUserMessage = useAIChatStore((state) => state.addUserMessage);
  const addAssistantMessage = useAIChatStore((state) => state.addAssistantMessage);
  const clearHistory = useAIChatStore((state) => state.clearHistory);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasHistory = messages.length > 1;

  function handleClearHistory() {
    if (!hasHistory || isSubmitting) return;
    clearHistory();
    setDraft("");
    toast.success("Riwayat chat berhasil dibersihkan.");
  }

  function handleTestRequest() {
    if (isSubmitting) return;
    void submitMessage(testRequestPrompt);
  }

  async function submitMessage(content: string) {
    const normalized = content.trim();
    if (!normalized || isSubmitting) return;

    const history = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    addUserMessage(normalized);
    setDraft("");

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: normalized,
          history,
        }),
      });

      const data = (await response.json()) as { reply?: string };
      const reply =
        data.reply?.trim() ||
        "Maaf, saya belum bisa menghasilkan jawaban saat ini. Coba lagi ya.";

      addAssistantMessage(reply);
    } catch {
      toast.error("Gagal menghubungi AI assistant.");
      addAssistantMessage(
        "Koneksi ke AI assistant gagal. Coba cek server dan AI_API_KEY, lalu ulangi."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Chatbot"
        description="Prototype frontend chatbot yang meniru percakapan berbasis data customer."
      />

      <Alert className="bg-secondary-background text-foreground">
        <Info className="h-4 w-4" />
        <AlertDescription>
          AI Chatbot menggunakan LangChain SQL Agent untuk query database secara langsung.
          Setiap pesan mungkin memerlukan waktu <strong>10–30 detik</strong> untuk diproses.
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-border shadow-shadow">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl">Global Promo Assistant</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting}
                onClick={handleTestRequest}
              >
                <FlaskConical className="h-4 w-4" />
                Test Request
              </Button>
              <Button
                type="button"
                variant="neutral"
                size="sm"
                disabled={!hasHistory || isSubmitting}
                onClick={handleClearHistory}
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-2 border-border bg-main text-main-foreground">
              Live AI
            </Badge>
            <Badge className="border-2 border-border bg-secondary-background">
              Model: {aiModel}
            </Badge>
            <Badge className="max-w-full truncate border-2 border-border bg-secondary-background" title={aiBaseUrl}>
              Base URL: {aiBaseUrl}
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
            isSubmitting={isSubmitting}
            onDraftChange={setDraft}
            onSubmit={() => submitMessage(draft)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
