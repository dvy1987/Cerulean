// AI Provider abstraction layer
// Supports Gemini, OpenAI, and Anthropic via a unified interface.
// Provider selection is based on which API key is configured.

export type AiProvider = "gemini" | "openai" | "anthropic" | "openrouter" | "dev";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  content: string;
}

// Provider-specific API formatting

function buildGeminiBody(req: CompletionRequest) {
  // Gemini uses a different message format: system instruction is separate
  const systemMsg = req.messages.find((m) => m.role === "system");
  const chatMessages = req.messages.filter((m) => m.role !== "system");

  const contents = chatMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  return {
    ...(systemMsg ? { system_instruction: { parts: [{ text: systemMsg.content }] } } : {}),
    contents,
    generationConfig: {
      temperature: req.temperature ?? 0.7,
      maxOutputTokens: req.maxTokens ?? 2048,
    },
  };
}

function buildOpenAiBody(req: CompletionRequest) {
  return {
    messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: req.temperature ?? 0.7,
    max_tokens: req.maxTokens ?? 2048,
  };
}

function buildAnthropicBody(req: CompletionRequest) {
  // Anthropic uses a separate `system` parameter
  const systemMsg = req.messages.find((m) => m.role === "system");
  const chatMessages = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  return {
    ...(systemMsg ? { system: systemMsg.content } : {}),
    messages: chatMessages,
    temperature: req.temperature ?? 0.7,
    max_tokens: req.maxTokens ?? 2048,
  };
}

// Provider endpoints and response parsing

interface ProviderSpec {
  getUrl: (model: string, apiKey: string) => string;
  getHeaders: (apiKey: string) => Record<string, string>;
  buildBody: (req: CompletionRequest, model: string) => unknown;
  parseResponse: (json: unknown) => string;
}

const PROVIDERS: Record<Exclude<AiProvider, "dev">, ProviderSpec> = {
  gemini: {
    getUrl: (model, apiKey) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    getHeaders: () => ({ "Content-Type": "application/json" }),
    buildBody: (req) => buildGeminiBody(req),
    parseResponse: (json) => {
      const data = json as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    },
  },
  openai: {
    getUrl: () => "https://api.openai.com/v1/chat/completions",
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: (req, model) => ({ model, ...buildOpenAiBody(req) }),
    parseResponse: (json) => {
      const data = json as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? "";
    },
  },
  anthropic: {
    getUrl: () => `${process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com"}/v1/messages`,
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    buildBody: (req, model) => ({ model, ...buildAnthropicBody(req) }),
    parseResponse: (json) => {
      const data = json as { content?: Array<{ text?: string }> };
      return data.content?.[0]?.text ?? "";
    },
  },
  openrouter: {
    getUrl: () => "https://openrouter.ai/api/v1/chat/completions",
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: (req, model) => ({ model, ...buildOpenAiBody(req) }),
    parseResponse: (json) => {
      const data = json as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? "";
    },
  },
};

/**
 * Send a completion request to the configured AI provider.
 * This runs server-side only (called from API routes).
 */
export async function callProvider(
  config: ProviderConfig,
  request: CompletionRequest
): Promise<CompletionResponse> {
  if (config.provider === "dev") {
    throw new Error("Dev provider should not call callProvider — use dev-ai directly");
  }

  const spec = PROVIDERS[config.provider];
  const url = spec.getUrl(config.model, config.apiKey);
  const headers = spec.getHeaders(config.apiKey);
  const body = spec.buildBody(request, config.model);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${config.provider} API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const content = spec.parseResponse(json);

  return { content };
}

/**
 * Detect which provider to use based on environment variables.
 * Priority: GEMINI > OPENAI > ANTHROPIC > dev
 */
export function detectProviderConfig(): ProviderConfig {
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: "gemini",
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
      apiKey: process.env.GEMINI_API_KEY,
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY,
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
      apiKey: process.env.ANTHROPIC_API_KEY,
    };
  }

  if (process.env.OPENROUTER_API_KEY) {
    return {
      provider: "openrouter",
      model: process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4-20250514",
      apiKey: process.env.OPENROUTER_API_KEY,
    };
  }

  return { provider: "dev", model: "dev", apiKey: "" };
}
