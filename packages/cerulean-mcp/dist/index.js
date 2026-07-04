#!/usr/bin/env node
/**
 * Cerulean MCP Server
 *
 * This small program runs on your computer and acts as a bridge:
 *   Cursor/Antigravity  ←→  this server  ←→  your Cerulean app on Railway
 *
 * It speaks MCP on stdin/stdout. Never write debug logs to stdout.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CeruleanClient } from "./client.js";
import { loadConfig } from "./config.js";
import { SERVER_INSTRUCTIONS } from "./helpers.js";
import { registerCeruleanTools } from "./tools.js";
function logStderr(message) {
    process.stderr.write(`[cerulean-mcp] ${message}\n`);
}
async function main() {
    let config;
    try {
        config = loadConfig();
    }
    catch (err) {
        logStderr(err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
    const client = new CeruleanClient(config);
    // Prove credentials work before Cursor starts using tools
    try {
        const check = await client.verifyConnection();
        logStderr(`Connected ✓  document="${check.documentTitle}"  insights=${check.insightCount}  messages=${check.messageCount}`);
    }
    catch (err) {
        logStderr(`Warning: could not verify connection at startup — ${err instanceof Error ? err.message : err}`);
        logStderr("Tools may fail until CERULEAN_URL and CERULEAN_API_KEY are correct.");
    }
    const server = new McpServer({
        name: "cerulean",
        version: "0.2.0",
    }, {
        instructions: SERVER_INSTRUCTIONS,
    });
    registerCeruleanTools(server, client);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logStderr("Ready — waiting for Cursor/Antigravity");
}
main().catch((err) => {
    logStderr(`Fatal: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
});
