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
import { getTagColor } from "@/lib/tag-colors";
import { getProductColor } from "@/lib/product-colors";

interface PromoCardProps {
  idea: PromoIdea;
  onCopy: (message: string) => void;
}

function getConfidence(idea: PromoIdea) {
  const countMatch = idea.segment.match(/\((\d+)\s*pelanggan\)/i);
  const customerCount = countMatch ? Number.parseInt(countMatch[1] ?? "0", 10) : 0;
  const whyNow = idea.whyNow.toLowerCase();

  let trendBoost = 0;
  if (/(naik|melonjak|meningkat|largest|terbesar)/i.test(whyNow)) trendBoost += 18;
  if (/(stabil|konsisten|aktif)/i.test(whyNow)) trendBoost += 10;

  const score = Math.min(95, Math.max(40, customerCount + trendBoost));

  if (score >= 75) {
    return { score, label: "High" as const, className: "bg-green-500 text-white" };
  }
  if (score >= 60) {
    return { score, label: "Medium" as const, className: "bg-amber-400 text-black" };
  }
  return { score, label: "Low" as const, className: "bg-rose-500 text-white" };
}

export function PromoCard({ idea, onCopy }: PromoCardProps) {
  const confidence = getConfidence(idea);

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
          <div className="flex items-center gap-2">
            <Badge className="border-2 border-border bg-main text-main-foreground">
              AI Draft
            </Badge>
            <Badge className={`border-2 border-border ${confidence.className}`}>
              Confidence {confidence.score}% ({confidence.label})
            </Badge>
          </div>
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
                  className="border-2 border-border"
                  style={{ backgroundColor: getTagColor(tagName) }}
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
                <div
                  key={`${idea.id}-product-${productName}`}
                  className="inline-flex items-center rounded-base border-8 border-border px-2.5 py-1 text-sm font-base"
                  style={{ borderColor: getProductColor(productName) }}
                >
                  {productName}
                </div>
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
