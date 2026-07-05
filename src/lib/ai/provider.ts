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

export interface StreamProviderOptions {
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
}

function parseOpenAiStreamLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const data = trimmed.slice(5).trim();
  if (data === "[DONE]") return null;
  try {
    const json = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return json.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

function parseAnthropicStreamEvent(event: string): string | null {
  const lines = event.split("\n");
  let eventType = "";
  let data = "";
  for (const line of lines) {
    if (line.startsWith("event:")) eventType = line.slice(6).trim();
    if (line.startsWith("data:")) data = line.slice(5).trim();
  }
  if (eventType !== "content_block_delta" || !data) return null;
  try {
    const json = JSON.parse(data) as { delta?: { text?: string } };
    return json.delta?.text ?? null;
  } catch {
    return null;
  }
}

/**
 * Stream tokens from the provider when supported; falls back to buffered completion.
 */
export async function streamProvider(
  config: ProviderConfig,
  request: CompletionRequest,
  options: StreamProviderOptions
): Promise<CompletionResponse> {
  if (config.provider === "dev") {
    throw new Error("Dev provider should not call streamProvider");
  }

  const spec = PROVIDERS[config.provider];

  if (
    config.provider === "openai" ||
    config.provider === "openrouter"
  ) {
    const url = spec.getUrl(config.model, config.apiKey);
    const headers = spec.getHeaders(config.apiKey);
    const body = {
      ...(spec.buildBody(request, config.model) as Record<string, unknown>),
      stream: true,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${config.provider} stream error (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      const result = await callProvider(config, request);
      for (const ch of result.content) options.onChunk(ch);
      return result;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const chunk = parseOpenAiStreamLine(line);
        if (chunk) {
          full += chunk;
          options.onChunk(chunk);
        }
      }
    }

    if (full) return { content: full };
    const result = await callProvider(config, request);
    for (const ch of result.content) options.onChunk(ch);
    return result;
  }

  if (config.provider === "anthropic") {
    const url = spec.getUrl(config.model, config.apiKey);
    const headers = { ...spec.getHeaders(config.apiKey), Accept: "text/event-stream" };
    const body = {
      ...(spec.buildBody(request, config.model) as Record<string, unknown>),
      stream: true,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`anthropic stream error (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      const result = await callProvider(config, request);
      for (const ch of result.content) options.onChunk(ch);
      return result;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        const chunk = parseAnthropicStreamEvent(event);
        if (chunk) {
          full += chunk;
          options.onChunk(chunk);
        }
      }
    }

    if (full) return { content: full };
  }

  // Gemini and others: buffered fallback
  const result = await callProvider(config, request);
  if (result.content) options.onChunk(result.content);
  return result;
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
      model: process.env.OPENROUTER_MODEL ?? "qwen/qwen3-235b-a22b:free",
      apiKey: process.env.OPENROUTER_API_KEY,
    };
  }

  return { provider: "dev", model: "dev", apiKey: "" };
}

/** Resolve provider: user custom settings override env detection. */
export function resolveProviderConfig(opts?: {
  customProvider?: string;
  customModel?: string;
  customApiKey?: string;
}): ProviderConfig {
  if (opts?.customProvider && opts.customModel && opts.customApiKey) {
    return {
      provider: opts.customProvider as AiProvider,
      model: opts.customModel,
      apiKey: opts.customApiKey,
    };
  }
  return detectProviderConfig();
}
