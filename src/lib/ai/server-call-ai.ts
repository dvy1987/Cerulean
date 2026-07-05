import {
  callProvider,
  resolveProviderConfig,
  ProviderConfig,
  ChatMessage,
} from "./provider";

export interface ServerAICallOptions {
  systemPrompt: string;
  userMessage: string;
  providerConfig?: ProviderConfig;
}

/** Server-only completion via configured provider. Returns null in dev mode. */
export async function serverCallAI(options: ServerAICallOptions): Promise<string | null> {
  const config = options.providerConfig ?? resolveProviderConfig();
  if (config.provider === "dev") return null;

  const messages: ChatMessage[] = [
    { role: "system", content: options.systemPrompt },
    { role: "user", content: options.userMessage },
  ];

  const result = await callProvider(config, { messages });
  return result.content || null;
}

export async function serverCallAIForJSON<T>(
  options: ServerAICallOptions & { fallback: T }
): Promise<T> {
  const fullSystemPrompt =
    options.systemPrompt +
    "\n\nIMPORTANT: Respond with valid JSON only. No explanations, no markdown code fences, no surrounding text.";

  const text = await serverCallAI({
    ...options,
    systemPrompt: fullSystemPrompt,
  });

  if (!text) return options.fallback;

  try {
    const cleaned = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return options.fallback;
  }
}
