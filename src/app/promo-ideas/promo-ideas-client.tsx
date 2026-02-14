"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { PromoCard } from "./_components/promo-card";
import { PromoLibrary } from "./_components/promo-library";
import type { PromoIdea } from "@/lib/promo-ideas";
import { ChevronLeft, ChevronRight } from "lucide-react";

function formatWeekLabel(weekStart: string) {
  const date = new Date(`${weekStart}T00:00:00`);
  return `Minggu ${date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
}

export function PromoIdeasClient({ ideas }: { ideas: PromoIdea[] }) {
  const [activeTab, setActiveTab] = useState("recommended");

  const weeks = useMemo(() => {
    return Array.from(new Set(ideas.map((idea) => idea.weekStart))).sort((a, b) =>
      b.localeCompare(a)
    );
  }, [ideas]);

  const [activeWeek, setActiveWeek] = useState(weeks[0] ?? "");

  const currentWeekIndex = useMemo(
    () => weeks.findIndex((week) => week === activeWeek),
    [weeks, activeWeek]
  );

  const recommendedIdeas = useMemo(
    () => ideas.filter((idea) => idea.weekStart === activeWeek),
    [ideas, activeWeek]
  );

  async function copyMessage(message: string) {
    await navigator.clipboard.writeText(message);
    toast.success("Pesan promo berhasil disalin.");
  }

  function goToPreviousWeek() {
    const nextIndex = currentWeekIndex + 1;
    if (nextIndex < weeks.length) {
      setActiveWeek(weeks[nextIndex]);
    }
  }

  function goToNextWeek() {
    const nextIndex = currentWeekIndex - 1;
    if (nextIndex >= 0) {
      setActiveWeek(weeks[nextIndex]);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promo Ideas"
        description="Halaman frontend untuk simulasi rekomendasi kampanye mingguan."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="recommended">Rekomendasi Minggu Ini</TabsTrigger>
          <TabsTrigger value="library">Library Pesan</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-base border-2 border-border bg-secondary-background p-2">
            <Button
              variant="neutral"
              size="sm"
              onClick={goToPreviousWeek}
              disabled={currentWeekIndex === weeks.length - 1 || currentWeekIndex < 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Minggu Sebelumnya
            </Button>
            <div className="rounded-base border-2 border-border bg-background px-3 py-1.5 text-sm font-heading">
              {activeWeek ? formatWeekLabel(activeWeek) : "Belum ada data minggu"}
            </div>
            <Select value={activeWeek} onValueChange={setActiveWeek}>
              <SelectTrigger className="w-[230px] bg-background">
                <SelectValue placeholder="Pilih minggu" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week} value={week}>
                    {formatWeekLabel(week)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="neutral"
              size="sm"
              onClick={goToNextWeek}
              disabled={currentWeekIndex <= 0}
            >
              Minggu Berikutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {recommendedIdeas.map((idea) => (
            <PromoCard key={idea.id} idea={idea} onCopy={copyMessage} />
          ))}

          {recommendedIdeas.length === 0 ? (
            <div className="rounded-base border-2 border-border bg-secondary-background p-4 text-sm font-base text-foreground/70">
              Belum ada rekomendasi untuk minggu ini.
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <PromoLibrary ideas={ideas} onCopy={copyMessage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
