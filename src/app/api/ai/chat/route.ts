import { NextRequest, NextResponse } from "next/server";
import { callProvider, detectProviderConfig, ChatMessage, ProviderConfig, AiProvider } from "@/lib/ai/provider";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth/request-auth";
import { rateLimitResponse } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  const limited = rateLimitResponse(request, auth.userId);
  if (limited) return limited;

  try {
    const body = await request.json();
    const {
      messages,
      clientProvider,
      clientModel,
      clientApiKey,
    } = body as {
      messages: ChatMessage[];
      clientProvider?: string;
      clientModel?: string;
      clientApiKey?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    let config: ProviderConfig;

    if (clientProvider && clientModel && clientApiKey) {
      config = {
        provider: clientProvider as AiProvider,
        model: clientModel,
        apiKey: clientApiKey,
      };
    } else {
      config = detectProviderConfig();
    }

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
