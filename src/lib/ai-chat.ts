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

const AGENT_RECURSION_LIMIT = 16;

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
      temperature: 0.15,
      maxTokens: 800,
      maxRetries: 1,
    });

    return createAgent({
      model: llm,
      tools: [createSqlExecuteTool(5)],
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
          "- PENTING: Selalu gunakan double-quote untuk kolom camelCase, contoh: \"customerId\", \"tagId\", \"productId\", \"totalPrice\", \"soldAt\", \"favoriteProductId\", \"createdAt\", \"updatedAt\", \"promoWeekId\", \"weekStart\", \"promoIdeaId\".",
          "- Kalau query error, perbaiki query lalu coba lagi (maksimal 2 kali percobaan query).",
          "- Jawab ringkas, praktis, dan dalam Bahasa Indonesia.",
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
    const result = await agent.invoke(
      {
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
      },
      {
        recursionLimit: AGENT_RECURSION_LIMIT,
      }
    );

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
