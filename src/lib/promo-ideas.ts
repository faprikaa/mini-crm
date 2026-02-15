import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type PromoIdea = {
  id: string;
  theme: string;
  segment: string;
  whyNow: string;
  message: string;
  bestTime?: string;
  tagNames?: string[];
  productNames?: string[];
  weekStart: string;
};

export type PromoIdeaDraft = Omit<PromoIdea, "id" | "weekStart">;

export type PromoIdeaAIDraft = PromoIdeaDraft & {
  suggestedTagNames?: string[];
  suggestedProductNames?: string[];
};

type ThemeCandidate = PromoIdeaAIDraft & {
  score: number;
};

export const promoIdeas: PromoIdea[] = [
  {
    id: "caramel-week-2026-02-09",
    theme: "Caramel Week",
    segment: "Pelanggan dengan minat sweet drinks atau caramel (42 pelanggan)",
    whyNow: "Minat minuman manis jadi kelompok terbesar minggu ini.",
    message:
      "Hi! New Caramel Cold Brew lagi hadir minggu ini - diskon 10% sampai Minggu. Mau coba besok pagi?",
    bestTime: "Morning rush (07:00 - 10:30)",
    weekStart: "2026-02-09",
  },
  {
    id: "pastry-bundle-2026-02-09",
    theme: "Pastry + Coffee Bundle",
    segment: "Pastry lovers + pembeli pagi (18 pelanggan)",
    whyNow: "Tag pastry naik tajam di hari kerja.",
    message:
      "Coba latte + croissant bundle, hemat 10k. Berlaku jam 7-11 pagi. Mau saya siapin?",
    bestTime: "Weekday breakfast (07:00 - 11:00)",
    weekStart: "2026-02-09",
  },
  {
    id: "oat-milk-weekend-2026-02-09",
    theme: "Weekend Oat Milk Special",
    segment: "Pelanggan oat milk dan healthy choice (26 pelanggan)",
    whyNow: "Minat oat milk stabil naik selama 3 minggu terakhir.",
    message:
      "Weekend ini ada Oat Latte special 15% off, cuma Sabtu-Minggu. Mau aku kirim menu rekomendasinya?",
    bestTime: "Weekend afternoon (14:00 - 18:00)",
    weekStart: "2026-02-09",
  },
  {
    id: "flash-lunch-2026-02-02",
    theme: "Lunch Hour Flash Promo",
    segment: "Pekerja kantor area sekitar (31 pelanggan)",
    whyNow: "Traffic jam makan siang sempat turun minggu lalu.",
    message:
      "Jam 12-14 hari ini ada flash promo buy 1 get 1 untuk Espresso based. Mau aku reserve slot kamu?",
    bestTime: "Weekday lunch (12:00 - 14:00)",
    weekStart: "2026-02-02",
  },
  {
    id: "member-referral-2026-02-02",
    theme: "Member Referral Push",
    segment: "Member VIP + pelanggan loyal (15 pelanggan)",
    whyNow: "Referral conversion naik setelah campaign sebelumnya.",
    message:
      "Ajak 1 teman minggu ini, dapat voucher 20k untuk kunjungan berikutnya. Mau aku kirim kode referral kamu?",
    bestTime: "After work (17:00 - 20:00)",
    weekStart: "2026-02-02",
  },
  {
    id: "manual-brew-story-2026-01-26",
    theme: "Manual Brew Story Week",
    segment: "Single origin & pour over lovers (12 pelanggan)",
    whyNow: "Konten edukasi origin perform paling baik di IG minggu itu.",
    message:
      "Minggu ini ada special beans Ethiopia untuk pour over. Mau booking sesi cupping mini 15 menit?",
    bestTime: "Late afternoon (15:00 - 18:00)",
    weekStart: "2026-01-26",
  },
];

const generatedPromoIdeaSchema = z.object({
  theme: z.string().min(4).max(80),
  segment: z.string().min(8).max(180),
  whyNow: z.string().min(12).max(220),
  message: z
    .string()
    .min(20)
    .max(320)
    .refine(
      (value) => {
        const sentenceCount = value
          .trim()
          .split(/[.!?]+/)
          .map((part) => part.trim())
          .filter(Boolean).length;
        return sentenceCount >= 1 && sentenceCount <= 2;
      },
      { message: "Message harus 1-2 kalimat." }
    )
    .refine(
      (value) =>
        /(mau|balas|reply|klik|pesan|order|coba|reservasi|claim|jawab|yuk|dm)/i.test(
          value
        ),
      { message: "Message harus punya CTA yang jelas." }
    ),
  bestTime: z.string().min(4).max(80).optional(),
  suggestedTagNames: z.array(z.string().min(2).max(60)).max(5).default([]),
  suggestedProductNames: z.array(z.string().min(2).max(80)).max(5).default([]),
});

const generatedPromoIdeasSchema = z.object({
  ideas: z.array(generatedPromoIdeaSchema).length(3),
});

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getWeekStart(date: Date) {
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(date);
  weekStart.setUTCDate(date.getUTCDate() + mondayOffset);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toStartOfDay(date: Date) {
  const output = new Date(date);
  output.setUTCHours(0, 0, 0, 0);
  return output;
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTimeWindowLabel(hour: number) {
  if (hour >= 6 && hour < 11) return "Morning rush (07:00 - 10:30)";
  if (hour >= 11 && hour < 14) return "Lunch break (11:00 - 14:00)";
  if (hour >= 14 && hour < 18) return "Afternoon break (14:00 - 18:00)";
  return "After work (17:00 - 20:00)";
}

function topEntries(map: Map<string, number>, limit: number) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function isValidMessageShape(value: string) {
  const sentenceCount = value
    .trim()
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
  const hasCta = /(mau|balas|reply|klik|pesan|order|coba|reservasi|claim|jawab|yuk|dm)/i.test(
    value
  );
  return sentenceCount >= 1 && sentenceCount <= 2 && hasCta;
}

function defaultMessageFromCandidate(
  candidate: Pick<PromoIdeaAIDraft, "theme" | "segment" | "whyNow" | "bestTime">
) {
  const bestTime = candidate.bestTime
    ? `Berlaku di ${candidate.bestTime}.`
    : "Berlaku minggu ini.";
  return `Hi! ${candidate.theme} lagi jalan minggu ini untuk ${candidate.segment.toLowerCase()}. ${bestTime} Mau aku siapin sekarang?`;
}

async function buildTopThemeCandidates(weekStart: string): Promise<ThemeCandidate[]> {
  const now = new Date(`${weekStart}T00:00:00.000Z`);
  const start14Days = toStartOfDay(new Date(now));
  start14Days.setUTCDate(start14Days.getUTCDate() - 14);

  const start28Days = toStartOfDay(new Date(now));
  start28Days.setUTCDate(start28Days.getUTCDate() - 28);

  const start30Days = toStartOfDay(new Date(now));
  start30Days.setUTCDate(start30Days.getUTCDate() - 30);

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      select: {
        id: true,
        tags: {
          select: {
            name: true,
          },
        },
        sales: {
          where: {
            soldAt: {
              gte: start30Days,
            },
          },
          select: {
            soldAt: true,
            quantity: true,
            productId: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
      },
    }),
  ]);

  const productById = new Map(products.map((product) => [product.id, product]));

  const tagCustomerIds = new Map<string, Set<string>>();
  const tagRecentQty = new Map<string, number>();
  const tagPrevQty = new Map<string, number>();
  const tagTimeBuckets = new Map<string, Map<string, number>>();
  const tagProductQty = new Map<string, Map<string, number>>();
  const categoryRecentQty = new Map<string, number>();
  const categoryPrevQty = new Map<string, number>();
  const categoryCustomerIds = new Map<string, Set<string>>();
  const categoryProductQty = new Map<string, Map<string, number>>();
  const morningBuyerIds = new Set<string>();
  const pairCustomerIds = new Map<string, Set<string>>();

  for (const customer of customers) {
    const tagNames = customer.tags.map((tag) => tag.name.trim()).filter(Boolean);
    const uniqueTagNames = Array.from(new Set(tagNames));

    for (const tagName of uniqueTagNames) {
      if (!tagCustomerIds.has(tagName)) {
        tagCustomerIds.set(tagName, new Set());
      }
      tagCustomerIds.get(tagName)?.add(customer.id);
    }

    let morningQty = 0;
    let totalQty = 0;

    for (const sale of customer.sales) {
      const soldAt = new Date(sale.soldAt);
      const quantity = sale.quantity;
      totalQty += quantity;

      const hour = soldAt.getUTCHours();
      if (hour >= 6 && hour < 11) {
        morningQty += quantity;
      }

      const isRecent = soldAt >= start14Days;
      const isPrevious = soldAt >= start28Days && soldAt < start14Days;

      const product = productById.get(sale.productId);
      const category = product?.category?.trim() || "Uncategorized";
      const productName = product?.name ?? "Unknown Product";

      if (!categoryCustomerIds.has(category)) {
        categoryCustomerIds.set(category, new Set());
      }
      categoryCustomerIds.get(category)?.add(customer.id);

      if (!categoryProductQty.has(category)) {
        categoryProductQty.set(category, new Map());
      }
      const categoryProducts = categoryProductQty.get(category);
      if (categoryProducts) {
        categoryProducts.set(productName, (categoryProducts.get(productName) ?? 0) + quantity);
      }

      if (isRecent) {
        categoryRecentQty.set(category, (categoryRecentQty.get(category) ?? 0) + quantity);
      }

      if (isPrevious) {
        categoryPrevQty.set(category, (categoryPrevQty.get(category) ?? 0) + quantity);
      }

      for (const tagName of uniqueTagNames) {
        if (isRecent) {
          tagRecentQty.set(tagName, (tagRecentQty.get(tagName) ?? 0) + quantity);

          if (!tagTimeBuckets.has(tagName)) {
            tagTimeBuckets.set(tagName, new Map());
          }
          const timeBuckets = tagTimeBuckets.get(tagName);
          if (timeBuckets) {
            const timeLabel = getTimeWindowLabel(hour);
            timeBuckets.set(timeLabel, (timeBuckets.get(timeLabel) ?? 0) + quantity);
          }

          if (!tagProductQty.has(tagName)) {
            tagProductQty.set(tagName, new Map());
          }
          const productsByTag = tagProductQty.get(tagName);
          if (productsByTag) {
            productsByTag.set(productName, (productsByTag.get(productName) ?? 0) + quantity);
          }
        }

        if (isPrevious) {
          tagPrevQty.set(tagName, (tagPrevQty.get(tagName) ?? 0) + quantity);
        }
      }
    }

    if (totalQty >= 2 && morningQty / Math.max(totalQty, 1) >= 0.5) {
      morningBuyerIds.add(customer.id);
    }

    for (let i = 0; i < uniqueTagNames.length; i += 1) {
      for (let j = i + 1; j < uniqueTagNames.length; j += 1) {
        const pairKey = [uniqueTagNames[i], uniqueTagNames[j]].sort().join("::");
        if (!pairCustomerIds.has(pairKey)) {
          pairCustomerIds.set(pairKey, new Set());
        }
        pairCustomerIds.get(pairKey)?.add(customer.id);
      }
    }
  }

  const tagCandidates: ThemeCandidate[] = topEntries(
    new Map(Array.from(tagCustomerIds.entries()).map(([tag, ids]) => [tag, ids.size])),
    6
  ).map(([tagName, customerCount]) => {
    const recent = tagRecentQty.get(tagName) ?? 0;
    const previous = tagPrevQty.get(tagName) ?? 0;
    const trendDelta = recent - previous;
    const trendPct =
      previous > 0 ? Math.round((trendDelta / previous) * 100) : recent > 0 ? 100 : 0;
    const bestTime =
      topEntries(tagTimeBuckets.get(tagName) ?? new Map<string, number>(), 1)[0]?.[0] ??
      "Morning rush (07:00 - 10:30)";
    const topProductsForTag = topEntries(
      tagProductQty.get(tagName) ?? new Map<string, number>(),
      2
    ).map((entry) => entry[0]);

    const whyNow =
      trendDelta > 0
        ? `Minat tag "${tagName}" naik ${trendPct}% dalam 2 minggu terakhir.`
        : recent > 0
          ? `Tag "${tagName}" tetap aktif dengan ${recent} transaksi dalam 2 minggu terakhir.`
          : `Tag "${tagName}" masih punya basis ${customerCount} pelanggan aktif bulan ini.`;

    return {
      theme: `${toTitleCase(tagName)} Week`,
      segment: `Pelanggan dengan tag "${tagName}" (${customerCount} pelanggan)`,
      whyNow,
      bestTime,
      suggestedTagNames: [tagName],
      suggestedProductNames: topProductsForTag,
      score: customerCount * 2 + Math.max(trendDelta, 0) * 3 + recent,
      message: defaultMessageFromCandidate({
        theme: `${toTitleCase(tagName)} Week`,
        segment: `Pelanggan dengan tag "${tagName}" (${customerCount} pelanggan)`,
        whyNow,
        bestTime,
      }),
    };
  });

  const pairEntries = topEntries(
    new Map(Array.from(pairCustomerIds.entries()).map(([pair, ids]) => [pair, ids.size])),
    3
  );

  const pairCandidates: ThemeCandidate[] = pairEntries.length
    ? [
        (() => {
          const [pairKey, pairCount] = pairEntries[0];
          const [tagA, tagB] = pairKey.split("::");
          const pairIds = pairCustomerIds.get(pairKey) ?? new Set<string>();
          const morningCount = Array.from(pairIds).filter((id) => morningBuyerIds.has(id)).length;
          const theme = `${toTitleCase(tagA)} + ${toTitleCase(tagB)} Bundle`;
          const segment =
            morningCount > 0
              ? `Pelanggan tag "${tagA}" + "${tagB}" dan pembeli pagi (${morningCount} pelanggan)`
              : `Pelanggan kombinasi tag "${tagA}" + "${tagB}" (${pairCount} pelanggan)`;
          const whyNow =
            morningCount > 0
              ? "Kombinasi minat ini paling aktif saat pagi di 2 minggu terakhir."
              : "Cluster kombinasi minat ini termasuk yang paling padat bulan ini.";
          const bestTime =
            morningCount > 0
              ? "Morning rush (07:00 - 10:30)"
              : "Weekday afternoon (14:00 - 17:00)";

          return {
            theme,
            segment,
            whyNow,
            bestTime,
            suggestedTagNames: [tagA, tagB],
            suggestedProductNames: [],
            score: pairCount * 3 + morningCount * 2,
            message: defaultMessageFromCandidate({
              theme,
              segment,
              whyNow,
              bestTime,
            }),
          };
        })(),
      ]
    : [];

  const categoryCandidates: ThemeCandidate[] = topEntries(categoryRecentQty, 3).map(
    ([category, recentQty]) => {
      const previous = categoryPrevQty.get(category) ?? 0;
      const delta = recentQty - previous;
      const pct = previous > 0 ? Math.round((delta / previous) * 100) : recentQty > 0 ? 100 : 0;
      const customerCount = categoryCustomerIds.get(category)?.size ?? 0;
      const topProducts = topEntries(
        categoryProductQty.get(category) ?? new Map<string, number>(),
        2
      ).map((entry) => entry[0]);
      const theme = `${toTitleCase(category)} Focus`;
      const segment = `Pelanggan yang sering beli kategori ${category} (${customerCount} pelanggan)`;
      const whyNow =
        delta > 0
          ? `Kategori ${category} naik ${pct}% dalam 2 minggu terakhir.`
          : `Kategori ${category} stabil dengan ${recentQty} transaksi terbaru.`;
      const bestTime = "Weekend afternoon (14:00 - 18:00)";

      return {
        theme,
        segment,
        whyNow,
        bestTime,
        suggestedTagNames: [],
        suggestedProductNames: topProducts,
        score: customerCount * 2 + Math.max(delta, 0) * 3 + recentQty,
        message: defaultMessageFromCandidate({
          theme,
          segment,
          whyNow,
          bestTime,
        }),
      };
    }
  );

  const merged = [...tagCandidates, ...pairCandidates, ...categoryCandidates]
    .sort((a, b) => b.score - a.score)
    .filter((item, index, array) => {
      return array.findIndex((candidate) => candidate.theme === item.theme) === index;
    })
    .slice(0, 3);

  if (merged.length === 3) {
    return merged;
  }

  const fallback = [...tagCandidates];
  while (fallback.length < 3) {
    const idx = fallback.length + 1;
    const theme = `Weekly Promo ${idx}`;
    const segment = `Semua pelanggan aktif (${customers.length} pelanggan)`;
    const whyNow = "Data tren minggu ini mengarah ke campaign broad-reach.";
    const bestTime = "Morning rush (07:00 - 10:30)";
    fallback.push({
      theme,
      segment,
      whyNow,
      bestTime,
      suggestedTagNames: [],
      suggestedProductNames: [],
      score: 1,
      message: defaultMessageFromCandidate({ theme, segment, whyNow, bestTime }),
    });
  }

  return fallback.slice(0, 3);
}

export function getCurrentWeekStart(): string {
  return formatDateOnly(getWeekStart(new Date()));
}

export async function generatePromoIdeaDraftsForWeek(
  weekStart: string
): Promise<PromoIdeaAIDraft[]> {
  const aiApiKey = process.env.AI_API_KEY;
  const aiBaseUrl = process.env.AI_BASE_URL;
  const aiModel = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";

  if (!aiApiKey) {
    throw new Error("AI_API_KEY belum diset. Generate Promo Ideas membutuhkan AI aktif.");
  }

  const [topCandidates, availableTags, availableProducts] = await Promise.all([
    buildTopThemeCandidates(weekStart),
    prisma.tag.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const model = new ChatOpenAI({
    apiKey: aiApiKey,
    configuration: {
      baseURL: aiBaseUrl,
    },
    model: aiModel,
    temperature: 0.2,
  });

  const modelWithStructuredOutput = model.withStructuredOutput(generatedPromoIdeasSchema);

  const response = await modelWithStructuredOutput.invoke(
    [
      "Kamu adalah CRM growth strategist untuk kedai kopi lokal di Indonesia.",
      "Gunakan kandidat tema yang sudah di-ranking dari seluruh customer + transaksi 30 hari.",
      "Wajib pakai 3 ide ini sesuai urutan ranking, jangan membuat ide baru.",
      "Brand voice wajib: hangat, santai, lokal (Bahasa Indonesia natural), tidak terlalu salesy, cocok untuk WhatsApp broadcast kedai kopi neighborhood.",
      "Gaya copy: gunakan sapaan natural, satu benefit utama, lalu CTA yang ringan dan jelas.",
      "Hindari kata-kata kaku seperti: pelanggan yth, penawaran terbaik kami, hormat kami.",
      "Top 3 kandidat:",
      JSON.stringify(topCandidates, null, 2),
      "Daftar tag valid (gunakan nama persis):",
      JSON.stringify(availableTags.map((item) => item.name), null, 2),
      "Daftar produk valid (gunakan nama persis):",
      JSON.stringify(availableProducts.map((item) => item.name), null, 2),
      "Aturan ketat:",
      "1) ideas wajib tepat 3 item.",
      "2) Theme dan segment tetap sesuai kandidat (boleh dipoles wording, tidak boleh ganti intent).",
      "3) WhyNow wajib 1 kalimat singkat berbasis tren kandidat.",
      "4) Message WA wajib 1-2 kalimat, friendly, dan ada CTA jelas.",
      "5) Message harus terdengar personal dan conversational, seolah admin kedai lagi chat langsung.",
      "6) Sisipkan angka promo hanya jika relevan (diskon %, hemat nominal, atau batas waktu).",
      "7) bestTime opsional, isi hanya jika yakin.",
      "8) suggestedTagNames hanya boleh tag yang ada di daftar valid.",
      "9) suggestedProductNames hanya boleh produk yang ada di daftar valid.",
    ].join("\n")
  );

  const parsed = generatedPromoIdeasSchema.parse(response);

  const validTagSet = new Set(availableTags.map((item) => item.name));
  const validProductSet = new Set(availableProducts.map((item) => item.name));

  return parsed.ideas.map((idea, index) => {
    const base = topCandidates[index];
    const safeMessage = isValidMessageShape(idea.message)
      ? idea.message
      : defaultMessageFromCandidate(base);

    return {
      theme: idea.theme || base.theme,
      segment: idea.segment || base.segment,
      whyNow: idea.whyNow || base.whyNow,
      message: safeMessage,
      bestTime: idea.bestTime || base.bestTime,
      suggestedTagNames:
        idea.suggestedTagNames?.filter((name) => validTagSet.has(name)) ??
        base.suggestedTagNames ??
        [],
      suggestedProductNames:
        idea.suggestedProductNames?.filter((name) => validProductSet.has(name)) ??
        base.suggestedProductNames ??
        [],
    };
  });
}

export function toPromoIdeaRowsForWeek(
  weekStart: string,
  drafts: PromoIdeaAIDraft[]
): PromoIdea[] {
  return drafts.map((idea, index) => ({
    id: `${toSlug(idea.theme)}-${weekStart}-${index + 1}`,
    theme: idea.theme,
    segment: idea.segment,
    whyNow: idea.whyNow,
    message: idea.message,
    bestTime: idea.bestTime,
    weekStart,
  }));
}
