import "dotenv/config";
import { DataSource } from "typeorm";
import { ChatOpenAI } from "@langchain/openai";
import { SqlDatabase } from "@langchain/classic/sql_db";
import { createSqlAgent, SqlToolkit } from "@langchain/classic/agents/toolkits/sql";
import { normalizeDatabaseUrl } from "../src/lib/database-url";

type GenerationMode = "new" | "existing" | "mixed";

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

async function main() {
  const aiApiKey = process.env.AI_API_KEY;
  const aiBaseUrl = process.env.AI_BASE_URL;
  const aiModel = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";

  if (!aiApiKey) {
    throw new Error("AI_API_KEY is required.");
  }

  const mode = getMode();

  const llm = new ChatOpenAI({
    apiKey: aiApiKey,
    configuration: {
      baseURL: aiBaseUrl,
    },
    model: aiModel,
    temperature: 0.2,
  });

  const dataSource = new DataSource({
    type: "postgres",
    url: normalizeDatabaseUrl(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false },
  });

  try {
    const db = await SqlDatabase.fromDataSourceParams({
      appDataSource: dataSource,
      sampleRowsInTableInfo: 2,
    });

    const toolkit = new SqlToolkit(db, llm);
    const agent = createSqlAgent(llm, toolkit, { topK: 20 });

    const input = [
      "Generate and insert realistic dummy CRM data for a coffee shop into PostgreSQL.",
      "Use available schema/tables exactly as discovered by tools.",
      `Mode: ${mode}`,
      "Mode rules:",
      "- new: mostly create brand-new tags/products/customers/sales",
      "- existing: prioritize existing products/customers/tags when generating sales, but you may add a few new rows",
      "- mixed: combine old + new data",
      "Required minimum inserts in this run:",
      "- at least 8 tags",
      "- at least 10 products",
      "- at least 16 customers",
      "- at least 80 sales",
      "- at least 1 PromoIdeaWeek row for current week",
      "- at least 3 PromoIdea rows linked to that PromoIdeaWeek",
      "Hard constraints:",
      "- soldAt for all inserted sales must be randomized within the last 30 days from NOW()",
      "- quantity between 1 and 5",
      "- totalPrice must match product price * quantity",
      "- use Indonesian-style names and realistic coffee-shop records",
      "- for PromoIdeaWeek, set weekStart to Monday 00:00:00 UTC for current week",
      "- for PromoIdea, fill fields: theme, segment, whyNow, message, bestTime",
      "",
      "After all SQL is done, return a concise summary with total inserted per entity.",
    ].join("\n");

    const result = await agent.invoke({ input });
    const output =
      typeof result.output === "string"
        ? result.output
        : JSON.stringify(result.output, null, 2);

    console.log(output);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
