import { prisma } from "@/lib/prisma";
import { PromoIdeasClient } from "./promo-ideas-client";

export const dynamic = "force-dynamic";

export default async function PromoIdeasPage() {
  const aiBaseUrl = process.env.AI_BASE_URL || "https://integrate.api.nvidia.com/v1";
  const aiModel = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";

  const weeks = await prisma.promoIdeaWeek.findMany({
    include: {
      generatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      ideas: {
        include: {
          promoIdeaTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          promoIdeaProducts: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: [
      { weekStart: "desc" },
      { createdAt: "desc" },
    ],
    take: 52,
  });

  const initialWeeks = weeks.map((week) => ({
    weekStart: week.weekStart.toISOString().slice(0, 10),
    lastGeneratedAt: week.lastGeneratedAt.toISOString(),
    generatedModel: week.generatedModel,
    generatedByName: week.generatedBy?.name ?? null,
    generatedByEmail: week.generatedBy?.email ?? null,
    ideas: week.ideas.map((idea) => ({
      id: idea.id,
      theme: idea.theme,
      segment: idea.segment,
      whyNow: idea.whyNow,
      message: idea.message,
      bestTime: idea.bestTime ?? undefined,
      tagNames: idea.promoIdeaTags.map((pt) => pt.tag.name),
      productNames: idea.promoIdeaProducts.map((pp) => pp.product.name),
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
