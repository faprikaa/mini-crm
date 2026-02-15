import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Megaphone, ArrowRight } from "lucide-react";

interface PromoIdea {
  id: string;
  theme: string;
  segment: string;
  message: string;
}

interface CampaignSectionProps {
  ideas: PromoIdea[];
}

export function CampaignSection({ ideas }: CampaignSectionProps) {
  return (
    <Card className="border-2 border-border shadow-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Campaign Minggu Ini</CardTitle>
        <Megaphone className="h-5 w-5 text-foreground/70" />
      </CardHeader>
      <CardContent className="space-y-3">
        {ideas.length === 0 ? (
          <p className="text-sm font-base text-foreground/70">
            Belum ada campaign. Generate promo ideas di halaman Promo Ideas.
          </p>
        ) : (
          ideas.slice(0, 3).map((idea) => (
            <div
              key={idea.id}
              className="space-y-1 rounded-base border-2 border-border bg-secondary-background p-3"
            >
              <p className="font-heading">{idea.theme}</p>
              <p className="text-sm font-base text-foreground/70">{idea.segment}</p>
              <p className="text-sm font-base">{idea.message}</p>
            </div>
          ))
        )}

        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="neutral">
            <Link href="/dashboard/promo-ideas">
              Lihat Promo Ideas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
