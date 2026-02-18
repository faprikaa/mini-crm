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
const AGENT_RECURSION_LIMIT = 40;

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
                "You are a PostgreSQL data generator for a coffee shop CRM. Be FAST and EFFICIENT.",
                "Use tool execute_sql to inspect tables and insert data.",
                "Authoritative schema (do not invent table or column names):",
                schemaInfo,
                `Mode: ${mode}`,
                "- new: create brand-new tags/products/customers/sales",
                "- existing: strictly reuse existing rows, only insert new sales",
                "- mixed: combine existing and new rows",
                "Minimum inserts:",
                ...minimumTargetLines,
                "SPEED RULES (critical):",
                "- BATCH multiple VALUES in a single INSERT statement, e.g. INSERT INTO \"Sale\" (...) VALUES (...), (...), (...)",
                "- Minimize tool calls. Combine as much as possible into fewer queries.",
                "- Stop IMMEDIATELY once minimum targets are met. Output summary and finish.",
                "Hard constraints:",
                "- ALWAYS double-quote camelCase columns & table names. PostgreSQL lowercases unquoted identifiers.",
                '- CORRECT: INSERT INTO "CustomerTag" ("customerId", "tagId") VALUES (\'x\', \'y\')',
                '- WRONG: INSERT INTO "CustomerTag" (customerId, tagId) — will fail.',
                "- Tables: \"Customer\", \"Tag\", \"Sale\", \"Product\", \"CustomerTag\", \"PromoIdeaTag\", \"PromoIdeaProduct\", \"PromoIdea\", \"PromoIdeaWeek\".",
                "- \"soldAt\": NOW() - (RANDOM() * INTERVAL '30 days'), always set explicitly",
                "- quantity 1-5, \"totalPrice\" = price * quantity",
                "- if mode=existing, NEVER INSERT INTO \"Tag\"/\"Product\"/\"Customer\"",
                "- Indonesian-style names, no DDL, one statement per tool call",
                "- every customer MUST have min 1 Tag via \"CustomerTag\"",
                "Final output: concise summary of rows inserted per entity.",
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
