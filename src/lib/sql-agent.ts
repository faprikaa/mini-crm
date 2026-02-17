import { DataSource } from "typeorm";
import { tool } from "langchain";
import { z } from "zod";
import { normalizeDatabaseUrl } from "@/lib/database-url";
import { SqlDatabase } from "@langchain/classic/sql_db";

// ─── Constants ───────────────────────────────────────────────────────────────

const DENY_RE = /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|REPLACE|TRUNCATE)\b/i;
const HAS_LIMIT_TAIL_RE = /\blimit\b\s+\d+(\s*,\s*\d+)?\s*;?\s*$/i;

// ─── Singleton: SqlDatabase & Schema ─────────────────────────────────────────

let sqlDatabasePromise: Promise<SqlDatabase> | null = null;
let schemaInfoPromise: Promise<string> | null = null;

export async function getSqlDatabase() {
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
            includesTables: ["Customer", "Tag", "Product", "Sale", "CustomerTag", "PromoIdeaTag", "PromoIdeaProduct"],
            sampleRowsInTableInfo: 2,
        });
    })();

    return sqlDatabasePromise;
}

export async function getSchemaInfo() {
    if (schemaInfoPromise) {
        return schemaInfoPromise;
    }

    schemaInfoPromise = (async () => {
        const db = await getSqlDatabase();
        return db.getTableInfo();
    })();

    return schemaInfoPromise;
}

// ─── SQL Sanitization ────────────────────────────────────────────────────────

export function sanitizeSqlQuery(rawQuery: string, defaultLimit = 10) {
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
        query += ` LIMIT ${defaultLimit}`;
    }

    return query;
}

// ─── Content Extraction ──────────────────────────────────────────────────────

export function extractTextContent(content: unknown): string {
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

// ─── Reusable SQL Tool Factory ───────────────────────────────────────────────

export function createSqlExecuteTool(defaultLimit = 10) {
    return tool(
        async ({ query }: { query: string }) => {
            const db = await getSqlDatabase();
            const safeQuery = sanitizeSqlQuery(query, defaultLimit);

            console.log(`[SQL Tool] Executing: ${safeQuery}`);

            try {
                const result = await db.run(safeQuery);
                return typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Failed to execute SQL query";
                console.error(`[SQL Tool] Error: ${message}`);
                throw new Error(message);
            }
        },
        {
            name: "execute_sql",
            description:
                "Execute a read-only PostgreSQL SELECT query and return results.",
            schema: z.object({
                query: z
                    .string()
                    .describe("PostgreSQL SELECT query to execute (read-only)."),
            }),
        }
    );
}

// ─── Agent Message Helpers ───────────────────────────────────────────────────

export function extractLatestAgentOutput(result: unknown): string {
    const messages =
        result && typeof result === "object" && "messages" in result
            ? (result as Record<string, unknown>).messages
            : null;
    const latestMessage =
        Array.isArray(messages) && messages.length > 0
            ? messages[messages.length - 1]
            : null;
    const latestContent =
        latestMessage &&
            typeof latestMessage === "object" &&
            "content" in latestMessage
            ? (latestMessage as Record<string, unknown>).content
            : "";

    return extractTextContent(latestContent).trim();
}
