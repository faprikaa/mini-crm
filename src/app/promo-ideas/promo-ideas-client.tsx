"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { generatePromoIdeasByWeek } from "./actions";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

type PromoWeekData = {
  weekStart: string;
  lastGeneratedAt: string;
  generatedModel: string | null;
  generatedByName: string | null;
  generatedByEmail: string | null;
  ideas: PromoIdea[];
};

const WEEK_OPTIONS_COUNT = 8;

function formatWeekLabel(weekStart: string) {
  const date = new Date(`${weekStart}T00:00:00`);
  return `Minggu ${date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  now.setUTCDate(now.getUTCDate() + mondayOffset);
  now.setUTCHours(0, 0, 0, 0);
  return toDateOnly(now);
}

function buildRecentWeeks() {
  const weeks: string[] = [];
  const current = new Date(`${getCurrentWeekStart()}T00:00:00.000Z`);

  for (let i = 0; i < WEEK_OPTIONS_COUNT; i += 1) {
    const candidate = new Date(current);
    candidate.setUTCDate(candidate.getUTCDate() - i * 7);
    weeks.push(toDateOnly(candidate));
  }

  return weeks;
}

function formatGeneratedAt(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PromoIdeasClient({
  initialWeeks,
  aiBaseUrl,
  aiModel,
}: {
  initialWeeks: PromoWeekData[];
  aiBaseUrl: string;
  aiModel: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("recommended");
  const [isPending, startTransition] = useTransition();

  const weeks = useMemo(() => {
    return Array.from(
      new Set([...buildRecentWeeks(), ...initialWeeks.map((item) => item.weekStart)])
    ).sort((a, b) => b.localeCompare(a));
  }, [initialWeeks]);

  const weeksMap = useMemo(
    () => new Map(initialWeeks.map((item) => [item.weekStart, item])),
    [initialWeeks]
  );

  const [activeWeek, setActiveWeek] = useState(weeks[0] ?? getCurrentWeekStart());

  const currentWeekIndex = useMemo(
    () => weeks.findIndex((week) => week === activeWeek),
    [weeks, activeWeek]
  );

  const recommendedIdeas = useMemo(
    () => weeksMap.get(activeWeek)?.ideas ?? [],
    [weeksMap, activeWeek]
  );

  const allIdeas = useMemo(
    () => initialWeeks.flatMap((week) => week.ideas),
    [initialWeeks]
  );

  const lastGeneratedAt = weeksMap.get(activeWeek)?.lastGeneratedAt;
  const generatedModel = weeksMap.get(activeWeek)?.generatedModel;

  async function copyMessage(message: string) {
    await navigator.clipboard.writeText(message);
    toast.success("Pesan promo berhasil disalin.");
  }

  function handleGenerate() {
    if (!activeWeek) {
      toast.error("Pilih minggu terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const result = await generatePromoIdeasByWeek(activeWeek);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Promo minggu ${formatWeekLabel(activeWeek)} berhasil digenerate.`);
      router.refresh();
    });
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

      <div className="bg-secondary-lattice flex flex-wrap gap-2 rounded-base border-2 border-border p-2 text-sm font-base">
        <span className="rounded-base border-2 border-border bg-background px-2 py-1">
          Model: {aiModel}
        </span>
        <span className="max-w-full truncate rounded-base border-2 border-border bg-background px-2 py-1" title={aiBaseUrl}>
          Base URL: {aiBaseUrl}
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="recommended">Rekomendasi Minggu Ini</TabsTrigger>
          <TabsTrigger value="library">Library Pesan</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          <div className="bg-secondary-lattice flex flex-wrap items-center gap-2 rounded-base border-2 border-border p-2">
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
            <Button size="sm" onClick={handleGenerate} disabled={isPending || !activeWeek}>
              <Sparkles className="h-4 w-4" />
              {isPending ? "Generating..." : "Generate"}
            </Button>
          </div>

          <div className="bg-lattice rounded-base border-2 border-border px-3 py-2 text-sm font-base">
            Last generated: {lastGeneratedAt ? formatGeneratedAt(lastGeneratedAt) : "Belum pernah"}
          </div>
          <div className="bg-lattice rounded-base border-2 border-border px-3 py-2 text-sm font-base">
            Generated by model: {generatedModel ?? aiModel}
          </div>

          {recommendedIdeas.map((idea) => (
            <PromoCard key={idea.id} idea={idea} onCopy={copyMessage} />
          ))}

          {recommendedIdeas.length === 0 ? (
            <div className="bg-secondary-lattice rounded-base border-2 border-border p-4 text-sm font-base text-foreground/70">
              Belum ada rekomendasi untuk minggu ini.
              Klik tombol Generate untuk membuat ide promo minggu ini.
            </div>
          ) : null}

          <div className="bg-lattice space-y-2 rounded-base border-2 border-border p-4">
            <p className="text-sm font-heading">Riwayat Generate Promo Ideas</p>
            <div className="space-y-2">
              {weeks
                .filter((week) => Boolean(weeksMap.get(week)?.lastGeneratedAt))
                .map((week) => {
                  const item = weeksMap.get(week);
                  if (!item) return null;

                  return (
                    <button
                      type="button"
                      key={`history-${week}`}
                      onClick={() => setActiveWeek(week)}
                      className="bg-secondary-lattice flex w-full flex-wrap items-center justify-between gap-2 rounded-base border-2 border-border px-3 py-2 text-left"
                    >
                      <div>
                        <p className="text-sm font-heading">{formatWeekLabel(week)}</p>
                        <p className="text-xs font-base text-foreground/70">
                          {formatGeneratedAt(item.lastGeneratedAt)}
                        </p>
                      </div>
                      <div className="text-right text-xs font-base text-foreground/80">
                        <p>Model: {item.generatedModel ?? aiModel}</p>
                        <p>Ideas: {item.ideas.length}</p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <PromoLibrary ideas={allIdeas} onCopy={copyMessage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
