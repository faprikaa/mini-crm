import { createAgent, SystemMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import {
  getSchemaInfo,
  createSqlExecuteTool,
  extractLatestAgentOutput,
} from "@/lib/sql-agent";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

const AGENT_RECURSION_LIMIT = 6;
const AGENT_TIMEOUT_MS = 55_000;

let sqlAgentPromise: Promise<ReturnType<typeof createAgent>> | null = null;

async function getSqlAgent() {
  if (sqlAgentPromise) {
    return sqlAgentPromise;
  }

  sqlAgentPromise = (async () => {
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
      temperature: 0,
      maxTokens: 400,
      maxRetries: 1,
    });

    return createAgent({
      model: llm,
      tools: [createSqlExecuteTool(5)],
      systemPrompt: new SystemMessage(
        [
          "Kamu adalah analis SQL CRM untuk kedai kopi. Jawab SINGKAT.",
          "Gunakan tool execute_sql saat butuh data. Usahakan 1 query saja, langsung jawab setelah dapat hasil.",
          "Skema (jangan mengarang tabel/kolom):",
          schemaInfo,
          "Aturan:",
          "- Hanya SELECT read-only, 1 query per panggilan, LIMIT 5 default.",
          "- KRITIS: Double-quote semua kolom camelCase & nama tabel. PostgreSQL lowercase identifier tanpa quote.",
          '- BENAR: ct."tagId", s."totalPrice", "CustomerTag"."customerId"',
          '- SALAH: ct.tagid, s.totalPrice (tanpa quote)',
          "- Tabel: \"Customer\", \"Tag\", \"Sale\", \"Product\", \"CustomerTag\", \"PromoIdeaTag\", \"PromoIdeaProduct\", \"PromoIdea\", \"PromoIdeaWeek\".",
          "- Kalau error, perbaiki & coba lagi (maks 1x retry).",
          "- Jawab ringkas dalam Bahasa Indonesia.",
        ].join("\n")
      ),
    });
  })();

  return sqlAgentPromise;
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
    const agent = await getSqlAgent();

    const agentPromise = agent.invoke(
      {
        messages: [
          ...history.slice(-4).map((item) => ({
            role: item.role,
            content: item.content,
          })),
          {
            role: "user",
            content: message,
          },
        ],
      },
      {
        recursionLimit: AGENT_RECURSION_LIMIT,
      }
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Agent timeout")), AGENT_TIMEOUT_MS)
    );

    const result = await Promise.race([agentPromise, timeoutPromise]);

    const output = extractLatestAgentOutput(result);

    if (!output) {
      return "Maaf, saya belum bisa menghasilkan jawaban sekarang. Coba ulang beberapa saat lagi.";
    }

    return output;
  } catch (error) {
    console.error("[AI Chat] Error:", error instanceof Error ? error.message : error);
    return "Maaf, koneksi AI ke database sedang bermasalah. Coba lagi sebentar.";
  }
}
