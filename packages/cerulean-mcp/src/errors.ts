export class CeruleanApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = "CeruleanApiError";
  }
}

export function toUserFriendlyError(err: unknown): string {
  if (err instanceof CeruleanApiError) {
    if (err.statusCode === 401) {
      return "Authentication failed. Your API key may be wrong or revoked. Generate a new one in Cerulean Settings.";
    }
    if (err.statusCode === 404) {
      return err.message || "That item was not found in your workspace.";
    }
    return err.message;
  }
  if (err instanceof Error) {
    if (err.name === "AbortError") {
      return "Request timed out. Is your Cerulean app running on Railway?";
    }
    if (err.message.includes("fetch failed")) {
      return "Could not reach Cerulean. Check CERULEAN_URL and your internet connection.";
    }
    return err.message;
  }
  return "Something went wrong talking to Cerulean.";
}
