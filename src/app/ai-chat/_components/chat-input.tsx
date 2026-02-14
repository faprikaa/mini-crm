"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal } from "lucide-react";

type ChatInputProps = {
  draft: string;
  isSubmitting?: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
};

export function ChatInput({
  draft,
  isSubmitting,
  onDraftChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-2"
    >
      <Textarea
        placeholder="Tulis pertanyaan kamu..."
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        rows={3}
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={!draft.trim() || Boolean(isSubmitting)}
      >
        <SendHorizonal className="h-4 w-4" />
        {isSubmitting ? "Mengirim..." : "Kirim"}
      </Button>
    </form>
  );
}
