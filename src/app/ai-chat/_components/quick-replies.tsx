"use client";

import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

type QuickRepliesProps = {
  prompts: string[];
  onSelect: (prompt: string) => void;
};

export function QuickReplies({ prompts, onSelect }: QuickRepliesProps) {
  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-1 text-sm font-heading">
        <Lightbulb className="h-4 w-4" />
        Coba prompt cepat
      </p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <Button
            key={prompt}
            size="sm"
            variant="neutral"
            onClick={() => onSelect(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}
