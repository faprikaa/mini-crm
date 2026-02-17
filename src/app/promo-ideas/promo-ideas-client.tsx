"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useBeforeUnload } from "@/hooks/use-before-unload";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PromoCard } from "./_components/promo-card";
import { PromoLibrary } from "./_components/promo-library";
import type { PromoIdea } from "@/lib/promo-ideas";
import { generatePromoIdeasByWeek } from "./actions";
import { ChevronDown, ChevronLeft, ChevronRight, History, Info, Sparkles } from "lucide-react";

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
  const [expandedHistoryWeek, setExpandedHistoryWeek] = useState<string | null>(null);

  useBeforeUnload(isPending);

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

  const historyWeeks = useMemo(
    () => weeks.filter((week) => Boolean(weeksMap.get(week)?.lastGeneratedAt)),
    [weeks, weeksMap]
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

    const startTime = Date.now();
    startTransition(async () => {
      const result = await generatePromoIdeasByWeek(activeWeek);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Promo minggu ${formatWeekLabel(activeWeek)} berhasil digenerate (${duration}s).`);
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

  function toggleHistoryWeek(week: string) {
    setExpandedHistoryWeek((prev) => (prev === week ? null : week));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promo Ideas"
        description="Halaman frontend untuk simulasi rekomendasi kampanye mingguan."
      />

      <div className="flex flex-wrap gap-2 rounded-base border-2 border-border bg-secondary-background p-2 text-sm font-base">
        <span className="rounded-base border-2 border-border bg-background px-2 py-1">
          Model: {aiModel}
        </span>
        <span className="max-w-full truncate rounded-base border-2 border-border bg-background px-2 py-1" title={aiBaseUrl}>
          Base URL: {aiBaseUrl}
        </span>
      </div>

      <Alert className={`text-foreground ${isPending ? "bg-main/20 border-main" : "bg-secondary-background"}`}>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {isPending ? (
            <strong>⏳ AI sedang memproses... Jangan tinggalkan halaman ini sampai selesai.</strong>
          ) : (
            <>Generate promo ideas menggunakan AI dan SQL tool untuk menganalisis data pelanggan.
              Proses ini dapat memakan waktu <strong>30–60 detik</strong>.</>
          )}
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-[520px]">
          <TabsTrigger value="recommended">Rekomendasi Minggu Ini</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
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
            <Button size="sm" onClick={handleGenerate} disabled={isPending || !activeWeek}>
              <Sparkles className="h-4 w-4" />
              {isPending ? "Generating..." : "Generate"}
            </Button>
          </div>

          <div className="rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-base">
            Last generated: {lastGeneratedAt ? formatGeneratedAt(lastGeneratedAt) : "Belum pernah"}
          </div>
          <div className="rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-base">
            Generated by model: {generatedModel ?? aiModel}
          </div>

          {recommendedIdeas.map((idea) => (
            <PromoCard key={idea.id} idea={idea} onCopy={copyMessage} />
          ))}

          {recommendedIdeas.length === 0 ? (
            <div className="rounded-base border-2 border-border bg-secondary-background p-4 text-sm font-base text-foreground/70">
              Belum ada rekomendasi untuk minggu ini.
              Klik tombol Generate untuk membuat ide promo minggu ini.
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background p-3">
            <History className="h-5 w-5" />
            <p className="text-sm font-heading">
              Riwayat Generate Promo Ideas ({historyWeeks.length} minggu)
            </p>
          </div>

          {historyWeeks.length === 0 ? (
            <div className="rounded-base border-2 border-border bg-secondary-background p-4 text-sm font-base text-foreground/70">
              Belum ada riwayat generate promo ideas.
            </div>
          ) : null}

          {historyWeeks.map((week) => {
            const item = weeksMap.get(week);
            if (!item) return null;

            const isExpanded = expandedHistoryWeek === week;

            return (
              <div
                key={`history-${week}`}
                className="rounded-base border-2 border-border bg-background"
              >
                <button
                  type="button"
                  onClick={() => toggleHistoryWeek(week)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary-background"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-sm font-heading">{formatWeekLabel(week)}</p>
                      <p className="text-xs font-base text-foreground/70">
                        {formatGeneratedAt(item.lastGeneratedAt)}
                        {item.generatedByName ? ` · ${item.generatedByName}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs font-base text-foreground/80">
                      <p>Model: {item.generatedModel ?? aiModel}</p>
                      <p>{item.ideas.length} ide promo</p>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                        }`}
                    />
                  </div>
                </button>

                {isExpanded ? (
                  <div className="space-y-3 border-t-2 border-border p-4">
                    {item.ideas.map((idea) => (
                      <PromoCard key={idea.id} idea={idea} onCopy={copyMessage} />
                    ))}
                    {item.ideas.length === 0 ? (
                      <p className="text-sm font-base text-foreground/70">
                        Tidak ada ide promo untuk minggu ini.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <PromoLibrary ideas={allIdeas} onCopy={copyMessage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
