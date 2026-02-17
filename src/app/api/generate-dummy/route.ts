import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { runDummyDataAgent, type GenerationMode } from "@/lib/dummy-agent";

const requestSchema = z.object({
    mode: z.enum(["new", "existing", "mixed"]).default("mixed"),
});

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { mode } = requestSchema.parse(body);

        const output = await runDummyDataAgent(mode as GenerationMode);

        return NextResponse.json({ output });
    } catch (error) {
        console.error("[generate-dummy]", error);

        if (
            error &&
            typeof error === "object" &&
            "lc_error_code" in error &&
            (error as Record<string, unknown>).lc_error_code === "GRAPH_RECURSION_LIMIT"
        ) {
            return NextResponse.json(
                { output: "⚠️ Agent mencapai batas langkah maksimum. Coba lagi dengan mode `existing` yang lebih ringan." },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { error: "Gagal generate dummy data. Coba lagi." },
            { status: 500 }
        );
    }
}
