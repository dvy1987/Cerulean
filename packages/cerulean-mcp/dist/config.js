export function loadConfig() {
    const url = process.env.CERULEAN_URL?.trim();
    const apiKey = process.env.CERULEAN_API_KEY?.trim();
    if (!url) {
        throw new Error("CERULEAN_URL is missing. Example: https://your-app.railway.app");
    }
    if (!apiKey) {
        throw new Error("CERULEAN_API_KEY is missing. Create one in Cerulean → Settings → MCP / CLI Access.");
    }
    if (!apiKey.startsWith("cer_")) {
        throw new Error("CERULEAN_API_KEY should start with cer_. Check you copied the full key from Settings.");
    }
    return {
        url,
        apiKey,
        requestTimeoutMs: Number(process.env.CERULEAN_TIMEOUT_MS ?? 30_000),
        maxRetries: Number(process.env.CERULEAN_MAX_RETRIES ?? 2),
    };
}
