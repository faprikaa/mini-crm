"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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

  await prisma.promoIdeaWeek.upsert({
    where: { weekStart: weekStartDate },
    update: {
      lastGeneratedAt,
      ideas: {
        deleteMany: {},
        create: drafts,
      },
    },
    create: {
      weekStart: weekStartDate,
      lastGeneratedAt,
      ideas: {
        create: drafts,
      },
    },
  });

  revalidatePath("/promo-ideas");
  return { success: true, count: drafts.length };
}
