"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Clock3 } from "lucide-react";
import type { PromoIdea } from "@/lib/promo-ideas";

interface PromoCardProps {
  idea: PromoIdea;
  onCopy: (message: string) => void;
}

export function PromoCard({ idea, onCopy }: PromoCardProps) {
  return (
    <Card className="border-2 border-border shadow-shadow">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5" />
              {idea.theme}
            </CardTitle>
            <CardDescription className="font-base">
              Segment: {idea.segment}
            </CardDescription>
          </div>
          <Badge className="border-2 border-border bg-main text-main-foreground">
            AI Draft
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-base border-2 border-border bg-secondary-background p-3">
          <p className="text-sm font-heading">Why now</p>
          <p className="font-base text-foreground/80">{idea.whyNow}</p>
        </div>

        <div className="rounded-base border-2 border-border bg-background p-3">
          <p className="text-sm font-heading">Ready message</p>
          <p className="font-base">{idea.message}</p>
        </div>

        {idea.tagNames && idea.tagNames.length > 0 ? (
          <div className="rounded-base border-2 border-border bg-secondary-background p-3">
            <p className="text-sm font-heading">Related tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {idea.tagNames.map((tagName) => (
                <Badge
                  key={`${idea.id}-tag-${tagName}`}
                  className="border-2 border-border bg-background"
                >
                  {tagName}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {idea.productNames && idea.productNames.length > 0 ? (
          <div className="rounded-base border-2 border-border bg-secondary-background p-3">
            <p className="text-sm font-heading">Related products</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {idea.productNames.map((productName) => (
                <Badge
                  key={`${idea.id}-product-${productName}`}
                  className="border-2 border-border bg-background"
                >
                  {productName}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-base text-foreground/70">
            <Clock3 className="h-4 w-4" />
            {idea.bestTime ?? "Waktu fleksibel"}
          </span>
          <Button
            variant="neutral"
            onClick={() => onCopy(idea.message)}
          >
            <Copy className="h-4 w-4" />
            Copy Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
