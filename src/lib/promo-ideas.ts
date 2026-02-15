import { createAgent, SystemMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getSchemaInfo,
  createSqlExecuteTool,
  extractLatestAgentOutput,
} from "@/lib/sql-agent";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Schemas ─────────────────────────────────────────────────────────────────

const generatedPromoIdeaSchema = z.object({
  theme: z.string().min(4).max(80),
  segment: z.string().min(8).max(180),
  whyNow: z.string().min(12).max(220),
  message: z.string().min(20).max(320),
  bestTime: z.string().min(4).max(80).optional(),
  suggestedTagNames: z.array(z.string().min(2).max(60)).max(5).optional(),
  suggestedProductNames: z.array(z.string().min(2).max(80)).max(5).optional(),
});

const generatedPromoIdeasSchema = z.object({
  ideas: z.array(generatedPromoIdeaSchema).min(1).max(5),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AGENT_RECURSION_LIMIT = 40;

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

// ─── Phase 1: Agent gathers DB insights ──────────────────────────────────────

async function gatherInsightsFromDB(
  weekStart: string,
  availableTagNames: string[],
  availableProductNames: string[]
): Promise<string> {
  const schemaInfo = await getSchemaInfo();
  const aiApiKey = process.env.AI_API_KEY;
  const aiBaseUrl = process.env.AI_BASE_URL;
  const aiModel = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";

  const llm = new ChatOpenAI({
    apiKey: aiApiKey,
    configuration: { baseURL: aiBaseUrl },
    model: aiModel,
    streaming: false,
    temperature: 0.1,
    maxRetries: 1,
  });

  const agent = await createAgent({
    model: llm,
    tools: [createSqlExecuteTool(10)],
    systemPrompt: new SystemMessage(
      [
        "Kamu adalah analis data CRM untuk kedai kopi lokal di Indonesia.",
        "Tugasmu: query database untuk mengumpulkan insight yang akan dipakai membuat ide promo.",
        "",
        "Skema database otoritatif:",
        schemaInfo,
        "",
        "Konteks minggu: " + weekStart,
        "",
        "Aturan query:",
        "- Hanya SELECT read-only.",
        "- Satu query per panggilan tool.",
        "- Batasi hasil max 10 baris.",
        "- Kalau query error, perbaiki lalu coba lagi (max 2 percobaan).",
        "",
        "Langkah kerja:",
        "1. Query top tags berdasarkan jumlah customer.",
        "2. Query tren sales 14 hari terakhir vs 14 hari sebelumnya.",
        "3. Query produk terlaris dan kategori populer.",
        "",
        "Setelah selesai query, rangkum semua insight yang kamu dapat dalam format teks.",
        "Sertakan angka-angka dan fakta spesifik dari hasil query.",
      ].join("\n")
    ),
  });

  console.log("[PromoAgent] Phase 1: Gathering DB insights...");

  const result = await agent.invoke(
    {
      messages: [
        {
          role: "user" as const,
          content: `Analisis data CRM untuk minggu ${weekStart}. Query database untuk dapat insight tentang customer tags, tren sales, dan produk populer. Rangkum hasilnya.`,
        },
      ],
    },
    { recursionLimit: AGENT_RECURSION_LIMIT }
  );

  const output = extractLatestAgentOutput(result);

  if (!output) {
    throw new Error("Agent gagal mengumpulkan insight dari database.");
  }

  console.log("[PromoAgent] Phase 1 complete. Insights collected.");
  return output;
}

// ─── Phase 2: Structured output generates promo ideas ────────────────────────

async function generateStructuredIdeas(
  weekStart: string,
  insights: string,
  availableTagNames: string[],
  availableProductNames: string[]
) {
  const aiApiKey = process.env.AI_API_KEY;
  const aiBaseUrl = process.env.AI_BASE_URL;
  const aiModel = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";

  const llm = new ChatOpenAI({
    apiKey: aiApiKey,
    configuration: { baseURL: aiBaseUrl },
    model: aiModel,
    streaming: false,
    temperature: 0.5,
    maxRetries: 2,
  });

  const structuredLlm = llm.withStructuredOutput(generatedPromoIdeasSchema);

  console.log("[PromoAgent] Phase 2: Generating structured promo ideas...");

  const result = await structuredLlm.invoke([
    {
      role: "system",
      content: [
        "Kamu adalah CRM growth strategist untuk kedai kopi lokal di Indonesia.",
        "Berdasarkan insight data yang diberikan, buat tepat 3 ide promo mingguan.",
        "",
        "Konteks minggu: " + weekStart,
        "",
        "Daftar tag valid (gunakan nama persis untuk suggestedTagNames):",
        JSON.stringify(availableTagNames),
        "",
        "Daftar produk valid (gunakan nama persis untuk suggestedProductNames):",
        JSON.stringify(availableProductNames),
        "",
        "Aturan ide promo:",
        "- theme: nama kampanye singkat (4-80 char).",
        "- segment: deskripsi target pelanggan dengan jumlah (8-180 char).",
        "- whyNow: 1 kalimat alasan berbasis data tren (12-220 char).",
        "- message: pesan WA 1-2 kalimat, friendly, ada CTA jelas (20-320 char). Brand voice: hangat, santai, lokal, tidak salesy.",
        "- bestTime: waktu terbaik kirim pesan (opsional).",
        "- suggestedTagNames: hanya tag dari daftar valid.",
        "- suggestedProductNames: hanya produk dari daftar valid.",
      ].join("\n"),
    },
    {
      role: "user",
      content: `Berikut insight dari data CRM minggu ${weekStart}:\n\n${insights}\n\nBuat 3 ide promo berdasarkan insight di atas.`,
    },
  ]);

  console.log("[PromoAgent] Phase 2 complete. Ideas generated.");
  return result;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getCurrentWeekStart(): string {
  return formatDateOnly(getWeekStart(new Date()));
}

export async function generatePromoIdeaDraftsForWeek(
  weekStart: string
): Promise<PromoIdeaAIDraft[]> {
  const aiApiKey = process.env.AI_API_KEY;

  if (!aiApiKey) {
    throw new Error(
      "AI_API_KEY belum diset. Generate Promo Ideas membutuhkan AI aktif."
    );
  }

  const [availableTags, availableProducts] = await Promise.all([
    prisma.tag.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const availableTagNames = availableTags.map((item) => item.name);
  const availableProductNames = availableProducts.map((item) => item.name);

  // Phase 1: Agent queries DB and collects insights
  const insights = await gatherInsightsFromDB(
    weekStart,
    availableTagNames,
    availableProductNames
  );

  // Phase 2: Structured output generates validated promo ideas
  let parsed: z.infer<typeof generatedPromoIdeasSchema>;
  try {
    parsed = await generateStructuredIdeas(
      weekStart,
      insights,
      availableTagNames,
      availableProductNames
    );
  } catch (error) {
    console.error(
      "[PromoAgent] Structured output failed, falling back to manual parse:",
      error instanceof Error ? error.message : error
    );
    // Fallback: re-throw with descriptive message
    throw new Error(
      "Gagal generate ide promo. AI tidak mengembalikan format yang valid. Coba lagi."
    );
  }

  const validTagSet = new Set(availableTagNames);
  const validProductSet = new Set(availableProductNames);

  return parsed.ideas.map((idea) => ({
    theme: idea.theme,
    segment: idea.segment,
    whyNow: idea.whyNow,
    message: idea.message,
    bestTime: idea.bestTime,
    suggestedTagNames:
      idea.suggestedTagNames?.filter((name) => validTagSet.has(name)) ?? [],
    suggestedProductNames:
      idea.suggestedProductNames?.filter((name) => validProductSet.has(name)) ??
      [],
  }));
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
