# Cerulean MCP Server

**New to MCP?** Read [`docs/WHAT-IS-MCP.md`](../../docs/WHAT-IS-MCP.md) — plain English, no jargon.

## Quick setup

1. Deploy Cerulean → sign in → Settings → **Generate API key**
2. `npm install && npm run build`
3. Add to Cursor `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cerulean": {
      "command": "node",
      "args": ["/absolute/path/to/packages/cerulean-mcp/dist/index.js"],
      "env": {
        "CERULEAN_URL": "https://your-app.railway.app",
        "CERULEAN_API_KEY": "cer_..."
      }
    }
  }
}
```

4. Restart Cursor. Ask: *"Verify my Cerulean connection"*

## What's inside (v0.2)

| File | Purpose |
|------|---------|
| `index.ts` | Starts the server, checks your key at startup |
| `client.ts` | Talks to Railway (timeouts, retries) |
| `tools.ts` | All 35+ actions the IDE can call |
| `helpers.ts` | Error handling + search helpers |
| `config.ts` | Reads your URL and API key |

## Key tools for daily use

- `cerulean_verify_connection` — test your setup
- `cerulean_save_chat_turn` — save what you and the AI discussed
- `cerulean_add_insight` — capture an idea
- `cerulean_promote_by_search` — "promote the insight about X"
- `cerulean_get_pending_patch` / `cerulean_accept_patch` — review document changes

## Security

Your API key = your data only. Revoke anytime in Settings.
