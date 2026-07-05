import { useAiSettingsStore } from "@/store/aiSettingsStore";
import { serverCallAI, serverCallAIForJSON } from "./server-call-ai";
import { resolveProviderConfig } from "./provider";

export interface AICallOptions {
  systemPrompt: string;
  userMessage: string;
}

function clientProviderPayload(): Record<string, string> {
  const { customProvider, customModel, customApiKey } = useAiSettingsStore.getState();
  if (customProvider && customModel && customApiKey) {
    return {
      clientProvider: customProvider,
      clientModel: customModel,
      clientApiKey: customApiKey,
    };
  }
  return {};
}

async function clientCallAI(options: AICallOptions): Promise<string | null> {
  try {
    const res = await fetch("/api/v1/ai/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: options.systemPrompt,
        userMessage: options.userMessage,
        ...clientProviderPayload(),
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.provider === "dev" || !data.content) return null;
    return data.content as string;
  } catch {
    return null;
  }
}

/** Unified AI completion — server uses provider directly; client uses /api/v1/ai/complete. */
export async function callAI(options: AICallOptions): Promise<string | null> {
  if (typeof window === "undefined") {
    return serverCallAI({ ...options, providerConfig: resolveProviderConfig() });
  }
  return clientCallAI(options);
}

export async function callAIForJSON<T>(options: AICallOptions & { fallback: T }): Promise<T> {
  if (typeof window === "undefined") {
    return serverCallAIForJSON({ ...options, providerConfig: resolveProviderConfig() });
  }

  try {
    const res = await fetch("/api/v1/ai/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: options.systemPrompt,
        userMessage: options.userMessage,
        jsonMode: true,
        fallback: options.fallback,
        ...clientProviderPayload(),
      }),
    });

    if (!res.ok) return options.fallback;
    const data = await res.json();
    if (data.content === null || data.content === undefined) return options.fallback;
    return data.content as T;
  } catch {
    return options.fallback;
  }
}
