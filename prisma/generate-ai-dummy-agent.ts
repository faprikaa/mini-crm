import "dotenv/config";
import { DataSource } from "typeorm";
import { createAgent, tool, SystemMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { SqlDatabase } from "@langchain/classic/sql_db";
import { z } from "zod";
import { normalizeDatabaseUrl } from "../src/lib/database-url";

type GenerationMode = "new" | "existing" | "mixed";

const DDL_RE = /\b(ALTER|DROP|CREATE|REPLACE|TRUNCATE|GRANT|REVOKE)\b/i;
const AGENT_RECURSION_LIMIT = 120;

let sqlDatabasePromise: Promise<SqlDatabase> | null = null;
let schemaInfoPromise: Promise<string> | null = null;
let sqlAgentPromise: Promise<ReturnType<typeof createAgent>> | null = null;

function getArg(name: string) {
  const prefixed = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefixed))?.slice(prefixed.length);
}

function getMode(): GenerationMode {
  const mode = getArg("mode");
  if (mode === "new" || mode === "existing" || mode === "mixed") {
    return mode;
  }
  return "mixed";
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

  if (!query) {
    throw new Error("SQL query must not be empty.");
  }

  if (DDL_RE.test(query)) {
    throw new Error("DDL commands are blocked for safety.");
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
    description:
      "Execute ONE PostgreSQL SQL statement (SELECT/INSERT/UPDATE/DELETE) and return the result.",
    schema: z.object({
      query: z.string().describe("Single PostgreSQL statement to execute."),
    }),
  }
);

async function getSqlAgent(mode: GenerationMode) {
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
      temperature: 0,
      maxRetries: 1,
    });

    return createAgent({
      model: llm,
      tools: [executeSql],
      systemPrompt: new SystemMessage(
        [
          "You are a PostgreSQL data generator for a coffee shop CRM.",
          "Use tool execute_sql to inspect tables and insert realistic data.",
          "Authoritative schema (do not invent table or column names):",
          schemaInfo,
          "Mode:",
          `- ${mode}`,
          "Mode rules:",
          "- new: mostly create brand-new tags/products/customers/sales",
          "- existing: prioritize existing rows when creating sales, add only a few new rows",
          "- mixed: combine existing and new rows",
          "Required minimum inserts in this run:",
          "- at least 2 tags",
          "- at least 3 products",
          "- at least 4 customers",
          "- at least 10 sales",
          "- at least 1 PromoIdeaWeek for current week",
          "- at least 3 PromoIdea rows linked to that PromoIdeaWeek",
          "Hard constraints:",
          "- soldAt for all inserted sales randomized within last 30 days from NOW()",
          "- quantity between 1 and 5",
          "- totalPrice = product price * quantity",
          "- use Indonesian-style names and realistic coffee-shop records",
          "- weekStart uses Monday 00:00:00 UTC for current week",
          "- avoid DDL and schema changes",
          "- execute one SQL statement per tool call",
          "- hard cap: maximum 8 execute_sql tool calls, then stop and report partial progress",
          "Final output: concise summary of inserted/updated rows per entity and whether target was fully met.",
        ].join("\n")
      ),
    });
  })();

  return sqlAgentPromise;
}

async function main() {
  const aiApiKey = process.env.AI_API_KEY;
  const aiModel = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";

  if (!aiApiKey) {
    throw new Error("AI_API_KEY is required.");
  }
  console.log("AI Model:", aiModel);

  const mode = getMode();

  try {
    const agent = await getSqlAgent(mode);
    const result = await agent.invoke(
      {
        messages: [
          {
            role: "user",
            content:
              "Jalankan generate dummy data sesuai mode aktif. Hentikan setelah target minimum terpenuhi, lalu tampilkan ringkasan akhir.",
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

    console.log("=================== Output:");
    console.log(output || "No output from agent.");
    console.log("");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "lc_error_code" in error &&
      error.lc_error_code === "GRAPH_RECURSION_LIMIT"
    ) {
      throw new Error(
        `Agent stopped after ${AGENT_RECURSION_LIMIT} steps (GRAPH_RECURSION_LIMIT). Please rerun with a smaller model or lighter mode: pnpm run dummy:ai:agent --mode=existing`
      );
    }

    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
