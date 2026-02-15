import { prisma } from "@/lib/prisma";
import { PromoIdeasClient } from "./promo-ideas-client";

export const dynamic = "force-dynamic";

export default async function PromoIdeasPage() {
  const aiBaseUrl =
    process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
  const aiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const weeks = await prisma.promoIdeaWeek.findMany({
    include: {
      ideas: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      weekStart: "desc",
    },
  });

  const initialWeeks = weeks.map((week) => ({
    weekStart: week.weekStart.toISOString().slice(0, 10),
    lastGeneratedAt: week.lastGeneratedAt.toISOString(),
    ideas: week.ideas.map((idea) => ({
      id: idea.id,
      theme: idea.theme,
      segment: idea.segment,
      whyNow: idea.whyNow,
      message: idea.message,
      bestTime: idea.bestTime ?? undefined,
      weekStart: week.weekStart.toISOString().slice(0, 10),
    })),
  }));

  return (
    <PromoIdeasClient
      initialWeeks={initialWeeks}
      aiBaseUrl={aiBaseUrl}
      aiModel={aiModel}
    />
  );
}
