import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type PromoIdea = {
  id: string;
  theme: string;
  segment: string;
  whyNow: string;
  message: string;
  bestTime?: string;
  weekStart: string;
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
  message: z.string().min(20).max(320),
  bestTime: z.string().min(4).max(80),
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

function getFallbackIdeas(weekStart: string): PromoIdea[] {
  const currentWeekIdeas = promoIdeas
    .filter((idea) => idea.weekStart === weekStart)
    .slice(0, 3);

  if (currentWeekIdeas.length === 3) {
    return currentWeekIdeas;
  }

  const latestWeek = [...new Set(promoIdeas.map((idea) => idea.weekStart))].sort(
    (a, b) => b.localeCompare(a)
  )[0];

  return promoIdeas
    .filter((idea) => idea.weekStart === latestWeek)
    .slice(0, 3)
    .map((idea, index) => ({
      ...idea,
      id: `${idea.id}-fallback-${index + 1}`,
      weekStart,
    }));
}

async function getPromoDataContext() {
  const now = new Date();
  const last30Days = new Date(now);
  last30Days.setUTCDate(now.getUTCDate() - 30);

  const [customerCount, topTags, salesSummary, productSales] = await Promise.all([
    prisma.customer.count(),
    prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            customers: true,
          },
        },
      },
      orderBy: {
        customers: {
          _count: "desc",
        },
      },
      take: 8,
    }),
    prisma.sale.aggregate({
      where: {
        soldAt: {
          gte: last30Days,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalPrice: true,
      },
    }),
    prisma.sale.groupBy({
      by: ["productId"],
      where: {
        soldAt: {
          gte: last30Days,
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 6,
    }),
  ]);

  const topProducts = await prisma.product.findMany({
    where: {
      id: {
        in: productSales.map((item) => item.productId),
      },
    },
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  const productsById = new Map(topProducts.map((product) => [product.id, product]));

  return {
    customerCount,
    sales30Days: salesSummary._count.id,
    revenue30Days: salesSummary._sum.totalPrice ?? 0,
    topTags: topTags.map((tag) => ({
      name: tag.name,
      customerCount: tag._count.customers,
    })),
    topProducts: productSales.map((sale) => {
      const product = productsById.get(sale.productId);
      return {
        name: product?.name ?? "Unknown Product",
        category: product?.category ?? null,
        unitsSold: sale._sum.quantity ?? 0,
        salesCount: sale._count.id,
        revenue: sale._sum.totalPrice ?? 0,
      };
    }),
  };
}

export async function getWeeklyPromoIdeas(): Promise<PromoIdea[]> {
  const weekStart = formatDateOnly(getWeekStart(new Date()));
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!geminiApiKey) {
    return getFallbackIdeas(weekStart);
  }

  try {
    const context = await getPromoDataContext();
    const model = new ChatGoogleGenerativeAI({
      apiKey: geminiApiKey,
      model: geminiModel,
      temperature: 0.35,
    });

    const modelWithStructuredOutput = model.withStructuredOutput(
      generatedPromoIdeasSchema
    );

    const response = await modelWithStructuredOutput.invoke(
      [
        "Kamu adalah CRM growth strategist untuk kedai kopi lokal di Indonesia. " +
          "Buat tepat 3 ide promo mingguan yang realistis untuk WhatsApp broadcast.",
        "Gunakan data bisnis berikut sebagai dasar strategi:",
        JSON.stringify(context, null, 2),
        "Aturan ketat:",
        "1) ideas harus tepat 3 item.",
        "2) Gunakan Bahasa Indonesia natural, singkat, dan siap pakai.",
        "3) Segment harus jelas menyebut kelompok pelanggan target.",
        "4) whyNow harus merujuk ke insight data yang relevan.",
        "5) message harus berupa satu template pesan WhatsApp yang bisa langsung copy.",
        "6) bestTime berisi waktu kirim paling ideal.",
      ].join("\n")
    );

    const parsed = generatedPromoIdeasSchema.parse(response);

    return parsed.ideas.map((idea, index) => ({
      id: `${toSlug(idea.theme)}-${weekStart}-${index + 1}`,
      theme: idea.theme,
      segment: idea.segment,
      whyNow: idea.whyNow,
      message: idea.message,
      bestTime: idea.bestTime,
      weekStart,
    }));
  } catch {
    return getFallbackIdeas(weekStart);
  }
}
