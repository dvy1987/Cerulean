export interface AICallOptions {
  systemPrompt: string;
  userMessage: string;
}

export async function callAI(options: AICallOptions): Promise<string | null> {
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userMessage },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.provider === "dev" || !data.content) return null;

    return data.content as string;
  } catch {
    return null;
  }
}

export async function callAIForJSON<T>(options: AICallOptions & { fallback: T }): Promise<T> {
  const fullSystemPrompt =
    options.systemPrompt +
    "\n\nIMPORTANT: Respond with valid JSON only. No explanations, no markdown code fences, no surrounding text.";

  const text = await callAI({ systemPrompt: fullSystemPrompt, userMessage: options.userMessage });
  if (!text) return options.fallback;

  try {
    const cleaned = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return options.fallback;
  }
}
