/**
 * Standard shapes returned to the IDE AI — success or a clear error message.
 */
export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export function success(data: unknown, summary?: string): ToolResult {
  const body = {
    ok: true,
    summary: summary ?? "Success",
    data,
  };
  return {
    content: [{ type: "text", text: JSON.stringify(body, null, 2) }],
  };
}

export function failure(message: string, details?: unknown): ToolResult {
  const body = {
    ok: false,
    error: message,
    details: details ?? null,
    hint: "Check CERULEAN_URL and CERULEAN_API_KEY. Run cerulean_verify_connection to test.",
  };
  return {
    content: [{ type: "text", text: JSON.stringify(body, null, 2) }],
    isError: true,
  };
}
