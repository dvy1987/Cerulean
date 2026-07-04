export function success(data, summary) {
    const body = {
        ok: true,
        summary: summary ?? "Success",
        data,
    };
    return {
        content: [{ type: "text", text: JSON.stringify(body, null, 2) }],
    };
}
export function failure(message, details) {
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
