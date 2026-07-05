import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { serverCallAI, serverCallAIForJSON } from "@/lib/ai/server-call-ai";
import { resolveProviderConfig } from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    const body = await request.json();
    const {
      systemPrompt,
      userMessage,
      jsonMode,
      fallback,
      clientProvider,
      clientModel,
      clientApiKey,
    } = body as {
      systemPrompt: string;
      userMessage: string;
      jsonMode?: boolean;
      fallback?: unknown;
      clientProvider?: string;
      clientModel?: string;
      clientApiKey?: string;
    };

    if (!systemPrompt || !userMessage) {
      return Response.json(
        { error: "systemPrompt and userMessage are required" },
        { status: 400 }
      );
    }

    const providerConfig = resolveProviderConfig(
      clientProvider && clientModel && clientApiKey
        ? { customProvider: clientProvider, customModel: clientModel, customApiKey: clientApiKey }
        : undefined
    );

    if (jsonMode) {
      const data = await serverCallAIForJSON({
        systemPrompt,
        userMessage,
        fallback: fallback ?? null,
        providerConfig,
      });
      return jsonOk({ content: data, provider: providerConfig.provider });
    }

    const content = await serverCallAI({ systemPrompt, userMessage, providerConfig });
    return jsonOk({ content, provider: providerConfig.provider });
  });
}
