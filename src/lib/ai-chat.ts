import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { prisma } from "@/lib/prisma";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

async function getBusinessContext() {
  const now = new Date();
  const last30Days = new Date(now);
  last30Days.setUTCDate(now.getUTCDate() - 30);

  const [customerCount, topTags, salesSummary, productSales] = await Promise.all([
    prisma.customer.count(),
    prisma.tag.findMany({
      select: {
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
      take: 6,
    }),
    prisma.sale.aggregate({
      where: {
        soldAt: {
          gte: last30Days,
        },
      },
      _count: { id: true },
      _sum: { totalPrice: true },
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
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 4,
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

  const productMap = new Map(topProducts.map((item) => [item.id, item]));

  return {
    customerCount,
    sales30Days: salesSummary._count.id,
    revenue30Days: salesSummary._sum.totalPrice ?? 0,
    topTags: topTags.map((tag) => ({
      name: tag.name,
      customerCount: tag._count.customers,
    })),
    topProducts: productSales.map((sale) => {
      const product = productMap.get(sale.productId);
      return {
        name: product?.name ?? "Unknown Product",
        category: product?.category ?? null,
        unitsSold: sale._sum.quantity ?? 0,
      };
    }),
  };
}

export async function generateAIChatReply({
  message,
  history,
}: {
  message: string;
  history: ConversationMessage[];
}) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!geminiApiKey) {
    return "GEMINI_API_KEY belum terpasang di environment. Isi dulu lalu coba lagi.";
  }

  const context = await getBusinessContext();
  const model = new ChatGoogleGenerativeAI({
    apiKey: geminiApiKey,
    model: geminiModel,
    temperature: 0.4,
  });

  const recentHistory = history.slice(-6);
  const prompt = [
    "Kamu adalah asisten CRM untuk kedai kopi di Indonesia.",
    "Jawab ringkas, praktis, dan langsung bisa dipakai owner cafe.",
    "Jika user meminta ide promo, beri rekomendasi konkret berbasis data konteks.",
    "Jika data tidak cukup, sebutkan asumsi secara singkat tanpa mengarang angka baru.",
    "",
    "Konteks bisnis:",
    JSON.stringify(context, null, 2),
    "",
    "Riwayat percakapan terbaru:",
    JSON.stringify(recentHistory, null, 2),
    "",
    `Pertanyaan user saat ini: ${message}`,
  ].join("\n");

  const response = await model.invoke(prompt);
  const content = response.text?.trim();

  if (!content) {
    return "Maaf, saya belum bisa menghasilkan jawaban sekarang. Coba ulang beberapa saat lagi.";
  }

  return content;
}
