/**
 * Reads and validates environment variables when the MCP server starts.
 */
export interface CeruleanConfig {
    url: string;
    apiKey: string;
    requestTimeoutMs: number;
    maxRetries: number;
}
export declare function loadConfig(): CeruleanConfig;
