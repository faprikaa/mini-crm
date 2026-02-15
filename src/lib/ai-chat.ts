import { DataSource } from "typeorm";
import { createAgent, tool, SystemMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { normalizeDatabaseUrl } from "@/lib/database-url";
import { SqlDatabase } from "@langchain/classic/sql_db";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type ModelTier = "fast" | "smart";

const DENY_RE = /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|REPLACE|TRUNCATE)\b/i;
const HAS_LIMIT_TAIL_RE = /\blimit\b\s+\d+(\s*,\s*\d+)?\s*;?\s*$/i;

let sqlDatabasePromise: Promise<SqlDatabase> | null = null;
let schemaInfoPromise: Promise<string> | null = null;
const sqlAgentPromises: Partial<Record<ModelTier, Promise<ReturnType<typeof createAgent>>>> = {};

const FAST_MODEL_DEFAULT = "meta/llama-3.1-8b-instruct";
const SMART_MODEL_DEFAULT = "meta/llama-3.1-70b-instruct";

const COMPLEX_QUERY_RE =
  /\b(analisis|tren|bandingkan|dibandingkan|segmentasi|prediksi|konversi|cohort|lifetime|ltv|roi|margin|top\s+\d+|ranking|growth|retensi|join|query|sql)\b/i;

function selectModelTier(message: string, history: ConversationMessage[]): ModelTier {
  const normalized = message.toLowerCase();
  const isLongPrompt = normalized.length > 220;
  const hasComplexIntent = COMPLEX_QUERY_RE.test(normalized);
  const hasLongHistory = history.length > 8;

  if (hasComplexIntent || isLongPrompt || hasLongHistory) {
    return "smart";
  }

  return "fast";
}

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
    query += " LIMIT 5";
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

async function getSqlAgent(tier: ModelTier) {
  const cachedAgent = sqlAgentPromises[tier];
  if (cachedAgent) {
    return cachedAgent;
  }

  sqlAgentPromises[tier] = (async () => {
    const aiApiKey = process.env.AI_API_KEY;
    const aiBaseUrl = process.env.AI_BASE_URL;
    const fastModel = process.env.AI_MODEL_FAST || FAST_MODEL_DEFAULT;
    const smartModel = process.env.AI_MODEL_SMART || SMART_MODEL_DEFAULT;
    const fallbackModel = process.env.AI_MODEL;
    const aiModel =
      tier === "smart"
        ? fallbackModel || smartModel
        : fallbackModel || fastModel;
    const schemaInfo = await getSchemaInfo();

    const llm = new ChatOpenAI({
      apiKey: aiApiKey,
      configuration: {
        baseURL: aiBaseUrl,
      },
      model: aiModel,
      streaming: false,
      temperature: 0,
      maxTokens: 420,
      maxRetries: 1,
    });

    return createAgent({
      model: llm,
      tools: [executeSql],
      systemPrompt: new SystemMessage(
        [
          "Kamu adalah analis SQL CRM untuk kedai kopi.",
          "Gunakan tool execute_sql saat butuh data aktual dari database.",
          "Skema database otoritatif (jangan mengarang tabel/kolom):",
          schemaInfo,
          "Aturan:",
          "- Hanya query SELECT read-only.",
          "- Gunakan satu query per panggilan tool.",
          "- Batasi hasil 5 baris kecuali user minta lebih.",
          "- Kalau query error, perbaiki query lalu coba lagi (maksimal 2 kali percobaan query).",
          "- Jawab ringkas, praktis, dan dalam Bahasa Indonesia.",
        ].join("\n")
      ),
    });
  })();

  return sqlAgentPromises[tier] as Promise<ReturnType<typeof createAgent>>;
}

export async function generateAIChatReply({
  message,
  history,
}: {
  message: string;
  history: ConversationMessage[];
}) {
  if (!process.env.AI_API_KEY) {
    return "AI_API_KEY belum terpasang di environment. Isi dulu lalu coba lagi.";
  }

  try {
    const modelTier = selectModelTier(message, history);
    const agent = await getSqlAgent(modelTier);
    const result = await agent.invoke({
      messages: [
        ...history.slice(-6).map((item) => ({
          role: item.role,
          content: item.content,
        })),
        {
          role: "user",
          content: message,
        },
      ],
    });

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
      return "Maaf, saya belum bisa menghasilkan jawaban sekarang. Coba ulang beberapa saat lagi.";
    }

    return output;
  } catch {
    return "Maaf, koneksi AI ke database sedang bermasalah. Coba lagi sebentar.";
  }
}
