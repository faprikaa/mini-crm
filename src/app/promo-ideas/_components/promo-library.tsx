"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Megaphone } from "lucide-react";
import type { PromoIdea } from "@/lib/promo-ideas";

interface PromoLibraryProps {
  ideas: PromoIdea[];
  onCopy: (message: string) => void;
}

export function PromoLibrary({ ideas, onCopy }: PromoLibraryProps) {
  return (
    <Card className="border-2 border-border shadow-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Megaphone className="h-5 w-5" />
          Template Pesan Promo
        </CardTitle>
        <CardDescription className="font-base">
          Simulasi pesan siap pakai untuk WA broadcast.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ideas.map((idea) => (
          <div
            key={`library-${idea.id}`}
            className="rounded-base border-2 border-border bg-secondary-background p-3"
          >
            <p className="font-heading">{idea.theme}</p>
            <p className="mb-2 font-base text-sm text-foreground/80">{idea.message}</p>
            <Button size="sm" variant="neutral" onClick={() => onCopy(idea.message)}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
