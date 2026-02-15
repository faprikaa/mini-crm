import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAIChatReply } from "@/lib/ai-chat";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1200),
});

const requestSchema = z.object({
  message: z.string().min(1).max(1200),
  history: z.array(messageSchema).max(12).default([]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const safeBody = {
      ...body,
      history: Array.isArray(body.history)
        ? body.history.slice(-12)
        : [],
    };

    const { message, history } = requestSchema.parse(safeBody);

    const reply = await generateAIChatReply({ message, history });
    console.log(reply)
    return NextResponse.json({ reply });
  } catch (e) {
    console.log(e)
    return NextResponse.json(
      {
        reply:
          "Maaf, terjadi kendala saat memproses chat. Coba lagi sebentar ya.",
      },
      { status: 500 }
    );
  }
}
