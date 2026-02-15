import { DataSource } from "typeorm";
import { createAgent, tool, SystemMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeDatabaseUrl } from "@/lib/database-url";
import { SqlDatabase } from "@langchain/classic/sql_db";

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

const generatedPromoIdeaSchema = z.object({
  theme: z.string().min(4).max(80),
  segment: z.string().min(8).max(180),
  whyNow: z.string().min(12).max(220),
  message: z.string().min(20).max(320),
  bestTime: z.string().min(4).max(80).optional(),
  suggestedTagNames: z.array(z.string().min(2).max(60)).max(5).default([]),
  suggestedProductNames: z.array(z.string().min(2).max(80)).max(5).default([]),
});

const generatedPromoIdeasSchema = z.object({
  ideas: z.array(generatedPromoIdeaSchema).min(1).max(5),
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

const DENY_RE = /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|REPLACE|TRUNCATE)\b/i;
const HAS_LIMIT_TAIL_RE = /\blimit\b\s+\d+(\s*,\s*\d+)?\s*;?\s*$/i;
const AGENT_RECURSION_LIMIT = 30;

let sqlDatabasePromise: Promise<SqlDatabase> | null = null;
let schemaInfoPromise: Promise<string> | null = null;

function sanitizeSqlQuery(rawQuery: string) {
  let query = String(rawQuery ?? "").trim();
  const semicolonCount = [...query].filter((char) => char === ";").length;

  if (
    semicolonCount > 1 ||
    (query.endsWith(";") && query.slice(0, -1).includes(";"))
  ) {
    throw new Error("Multiple SQL statements are not allowed.");
  }

  query = query.replace(/;+\s*$/g, "").trim();

  if (!query.toLowerCase().startsWith("select")) {
    throw new Error("Only SELECT statements are allowed.");
  }

  if (DENY_RE.test(query)) {
    throw new Error("DML/DDL detected. Only read-only queries are permitted.");
  }

  if (!HAS_LIMIT_TAIL_RE.test(query)) {
    query += " LIMIT 10";
  }

  return query;
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }
        return "";
      })
      .join(" ")
      .trim();
  }

  return "";
}

async function getSqlDatabase() {
  if (sqlDatabasePromise) {
    return sqlDatabasePromise;
  }

  sqlDatabasePromise = (async () => {
    const dataSource = new DataSource({
      type: "postgres",
      url: normalizeDatabaseUrl(process.env.DATABASE_URL),
      ssl: { rejectUnauthorized: false },
    });

    return SqlDatabase.fromDataSourceParams({
      appDataSource: dataSource,
      includesTables: ["Customer", "Tag", "Product", "Sale"],
      sampleRowsInTableInfo: 2,
    });
  })();

  return sqlDatabasePromise;
}

async function getSchemaInfo() {
  if (schemaInfoPromise) {
    return schemaInfoPromise;
  }

  schemaInfoPromise = (async () => {
    const db = await getSqlDatabase();
    return db.getTableInfo();
  })();

  return schemaInfoPromise;
}

const executeSql = tool(
  async ({ query }: { query: string }) => {
    const db = await getSqlDatabase();
    const safeQuery = sanitizeSqlQuery(query);

    try {
      const result = await db.run(safeQuery);
      return typeof result === "string"
        ? result
        : JSON.stringify(result, null, 2);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to execute SQL query"
      );
    }
  },
  {
    name: "execute_sql",
    description: "Execute a read-only PostgreSQL SELECT query and return results.",
    schema: z.object({
      query: z
        .string()
        .describe("PostgreSQL SELECT query to execute (read-only)."),
    }),
  }
);

async function getPromoAgent(
  weekStart: string,
  availableTagNames: string[],
  availableProductNames: string[]
) {
  const aiApiKey = process.env.AI_API_KEY;
  const aiBaseUrl = process.env.AI_BASE_URL;
  const aiModel = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";
  const schemaInfo = await getSchemaInfo();

  const llm = new ChatOpenAI({
    apiKey: aiApiKey,
    configuration: {
      baseURL: aiBaseUrl,
    },
    model: aiModel,
    streaming: false,
    temperature: 0.2,
    maxRetries: 1,
  });

  return createAgent({
    model: llm,
    tools: [executeSql],
    systemPrompt: new SystemMessage(
      [
        "Kamu adalah CRM growth strategist untuk kedai kopi lokal di Indonesia.",
        "Tugasmu: analisis data customer, sales, dan tags dari database, lalu buat 3 ide promo mingguan.",
        "",
        "Gunakan tool execute_sql untuk query data dari database. Skema database otoritatif:",
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
        "Daftar tag valid (gunakan nama persis untuk suggestedTagNames):",
        JSON.stringify(availableTagNames),
        "",
        "Daftar produk valid (gunakan nama persis untuk suggestedProductNames):",
        JSON.stringify(availableProductNames),
        "",
        "Langkah kerja:",
        "1. Query top tags berdasarkan jumlah customer.",
        "2. Query tren sales 14 hari terakhir vs 14 hari sebelumnya.",
        "3. Query produk terlaris dan kategori populer.",
        "4. Dari hasil query, buat tepat 3 ide promo.",
        "",
        "Output WAJIB berupa JSON valid (tanpa markdown code block) dengan format:",
        '{"ideas": [{"theme": "...", "segment": "...", "whyNow": "...", "message": "...", "bestTime": "...", "suggestedTagNames": ["..."], "suggestedProductNames": ["..."]}]}',
        "",
        "Aturan ide promo:",
        "- theme: nama kampanye singkat (4-80 char).",
        "- segment: deskripsi target pelanggan dengan jumlah (8-180 char).",
        "- whyNow: 1 kalimat alasan berbasis data tren (12-220 char).",
        "- message: pesan WA 1-2 kalimat, friendly, ada CTA jelas (20-320 char). Brand voice: hangat, santai, lokal, tidak salesy.",
        "- bestTime: waktu terbaik kirim pesan (opsional).",
        "- suggestedTagNames: hanya tag dari daftar valid.",
        "- suggestedProductNames: hanya produk dari daftar valid.",
        "",
        "PENTING: Output terakhir HARUS berupa JSON valid saja, tanpa teks tambahan di luar JSON.",
      ].join("\n")
    ),
  });
}

export function getCurrentWeekStart(): string {
  return formatDateOnly(getWeekStart(new Date()));
}

export async function generatePromoIdeaDraftsForWeek(
  weekStart: string
): Promise<PromoIdeaAIDraft[]> {
  const aiApiKey = process.env.AI_API_KEY;

  if (!aiApiKey) {
    throw new Error("AI_API_KEY belum diset. Generate Promo Ideas membutuhkan AI aktif.");
  }

  const [availableTags, availableProducts] = await Promise.all([
    prisma.tag.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const availableTagNames = availableTags.map((item) => item.name);
  const availableProductNames = availableProducts.map((item) => item.name);

  const agent = await getPromoAgent(weekStart, availableTagNames, availableProductNames);

  const result = await agent.invoke(
    {
      messages: [
        {
          role: "user" as const,
          content: `Analisis data CRM dan buat 3 ide promo untuk minggu ${weekStart}. Query database dulu untuk dapat insight, lalu output JSON final.`,
        },
      ],
    },
    {
      recursionLimit: AGENT_RECURSION_LIMIT,
    }
  );

  const messages =
    result && typeof result === "object" && "messages" in result
      ? result.messages
      : null;
  const latestMessage =
    Array.isArray(messages) && messages.length > 0
      ? messages[messages.length - 1]
      : null;
  const latestContent =
    latestMessage && typeof latestMessage === "object" && "content" in latestMessage
      ? latestMessage.content
      : "";
  const output = extractTextContent(latestContent).trim();

  if (!output) {
    throw new Error("Agent tidak menghasilkan output.");
  }

  const jsonMatch =
    output.match(/```(?:json)?\s*([\s\S]*?)```/) ??
    output.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch?.[1]?.trim() ?? output;

  const parsed = generatedPromoIdeasSchema.parse(JSON.parse(jsonStr));

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
      idea.suggestedProductNames?.filter((name) => validProductSet.has(name)) ?? [],
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
