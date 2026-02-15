"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  generatePromoIdeaDraftsForWeek,
  getCurrentWeekStart,
} from "@/lib/promo-ideas";

function isValidWeekStart(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function generatePromoIdeasByWeek(weekStartInput?: string) {
  const weekStart = weekStartInput?.trim() || getCurrentWeekStart();

  if (!isValidWeekStart(weekStart)) {
    return { error: "Format minggu tidak valid." };
  }

  const weekStartDate = new Date(`${weekStart}T00:00:00.000Z`);
  const drafts = await generatePromoIdeaDraftsForWeek(weekStart);
  const lastGeneratedAt = new Date();
  const session = await auth();

  const tagNames = Array.from(
    new Set(
      drafts.flatMap((draft) => draft.suggestedTagNames ?? []).map((name) => name.trim())
    )
  ).filter(Boolean);
  const productNames = Array.from(
    new Set(
      drafts
        .flatMap((draft) => draft.suggestedProductNames ?? [])
        .map((name) => name.trim())
    )
  ).filter(Boolean);

  const [existingTags, existingProducts] = await Promise.all([
    tagNames.length > 0
      ? prisma.tag.findMany({ where: { name: { in: tagNames } }, select: { id: true, name: true } })
      : Promise.resolve([]),
    productNames.length > 0
      ? prisma.product.findMany({
          where: { name: { in: productNames } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const tagByName = new Map(existingTags.map((tag) => [tag.name, tag.id]));
  const productByName = new Map(existingProducts.map((product) => [product.name, product.id]));

  const ideasCreateInput = drafts.map((draft) => ({
    theme: draft.theme,
    segment: draft.segment,
    whyNow: draft.whyNow,
    message: draft.message,
    bestTime: draft.bestTime,
    tags: {
      connect: (draft.suggestedTagNames ?? [])
        .map((name) => tagByName.get(name.trim()))
        .filter((id): id is string => Boolean(id))
        .map((id) => ({ id })),
    },
    products: {
      connect: (draft.suggestedProductNames ?? [])
        .map((name) => productByName.get(name.trim()))
        .filter((id): id is string => Boolean(id))
        .map((id) => ({ id })),
    },
  }));

  await prisma.promoIdeaWeek.upsert({
    where: { weekStart: weekStartDate },
    update: {
      lastGeneratedAt,
      generatedById: session?.user?.id ?? null,
      ideas: {
        deleteMany: {},
        create: ideasCreateInput,
      },
    },
    create: {
      weekStart: weekStartDate,
      lastGeneratedAt,
      generatedById: session?.user?.id ?? null,
      ideas: {
        create: ideasCreateInput,
      },
    },
  });

  revalidatePath("/promo-ideas");
  return { success: true, count: drafts.length };
}
