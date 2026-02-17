import { DataSource } from "typeorm";
import { createAgent, tool, SystemMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { SqlDatabase } from "@langchain/classic/sql_db";
import { z } from "zod";
import { normalizeDatabaseUrl } from "@/lib/database-url";
import { extractLatestAgentOutput } from "@/lib/sql-agent";

export type GenerationMode = "new" | "existing" | "mixed";

const DDL_RE = /\b(ALTER|DROP|CREATE|REPLACE|TRUNCATE|GRANT|REVOKE)\b/i;
const EXISTING_MODE_BLOCKED_INSERT_RE =
    /^\s*INSERT\s+INTO\s+(?:"?public"?\.)?"?(Tag|Product|Customer)"?\b/i;
const AGENT_RECURSION_LIMIT = 120;

let sqlDatabasePromise: Promise<SqlDatabase> | null = null;
let schemaInfoPromise: Promise<string> | null = null;

async function getSqlDatabase() {
    if (sqlDatabasePromise) return sqlDatabasePromise;

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
    if (schemaInfoPromise) return schemaInfoPromise;

    schemaInfoPromise = (async () => {
        const db = await getSqlDatabase();
        return db.getTableInfo();
    })();

    return schemaInfoPromise;
}

function sanitizeSqlQuery(rawQuery: string, mode: GenerationMode) {
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

    if (mode === "existing" && EXISTING_MODE_BLOCKED_INSERT_RE.test(query)) {
        throw new Error(
            'Mode "existing" forbids INSERT on Tag/Product/Customer. Reuse existing rows and only create sales.'
        );
    }

    return query;
}

function createWriteSqlTool(mode: GenerationMode) {
    return tool(
        async ({ query }: { query: string }) => {
            const db = await getSqlDatabase();
            const safeQuery = sanitizeSqlQuery(query, mode);

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
}

export async function runDummyDataAgent(mode: GenerationMode): Promise<string> {
    const aiApiKey = process.env.AI_API_KEY;
    const aiBaseUrl = process.env.AI_BASE_URL;
    const aiModel = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";

    if (!aiApiKey) {
        throw new Error("AI_API_KEY is required.");
    }

    const schemaInfo = await getSchemaInfo();

    const llm = new ChatOpenAI({
        apiKey: aiApiKey,
        configuration: { baseURL: aiBaseUrl },
        model: aiModel,
        temperature: 0,
        maxRetries: 1,
    });

    const minimumTargetLines =
        mode === "existing"
            ? [
                "- at least 10 sales",
                "- 0 new tags",
                "- 0 new products",
                "- 0 new customers",
            ]
            : [
                "- at least 1 tags",
                "- at least 1 products",
                "- at least 1 customers",
                "- at least 10 sales",
            ];

    const agent = await createAgent({
        model: llm,
        tools: [createWriteSqlTool(mode)],
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
                "- existing: strictly reuse existing tags/products/customers and only insert new sales",
                "- mixed: combine existing and new rows. can create more than minimum target",
                "Required minimum inserts in this run:",
                ...minimumTargetLines,
                "Hard constraints:",
                "- every inserted sale MUST explicitly set soldAt (do not rely on DB default)",
                "- soldAt expression: NOW() - (RANDOM() * INTERVAL '30 days')",
                "- enforce soldAt between NOW() - INTERVAL '30 days' and NOW()",
                "- quantity between 1 and 5",
                "- totalPrice = product price * quantity",
                "- if mode is existing, NEVER INSERT INTO Tag/Product/Customer",
                "- use Indonesian-style names and realistic coffee-shop records",
                "- avoid DDL and schema changes",
                "- execute one SQL statement per tool call",
                "- every customer MUST have minimum one interest Tag. one customer can have multiple Tag",
                "Final output: concise summary of inserted/updated rows per entity and whether target was fully met.",
            ].join("\n")
        ),
    });

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

    const output = extractLatestAgentOutput(result);
    return output || "No output from agent.";
}
