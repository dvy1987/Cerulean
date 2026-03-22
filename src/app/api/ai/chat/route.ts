import { NextRequest, NextResponse } from "next/server";
import { callProvider, detectProviderConfig, ChatMessage } from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const config = detectProviderConfig();

    if (config.provider === "dev") {
      return NextResponse.json({ provider: "dev", content: null });
    }

    const result = await callProvider(config, { messages });

    return NextResponse.json({
      provider: config.provider,
      content: result.content,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("AI chat API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
