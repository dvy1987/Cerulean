---
name: cerulean-mcp
description: >
  Cerulean MCP server setup and IDE workflow. Load when connecting Cursor or
  Antigravity to Cerulean, configuring cerulean-mcp, using cerulean_* tools,
  API keys for MCP, or managing the thinking workspace from the IDE.
license: MIT
metadata:
  author: dvy1987
  version: "1.0"
  category: domain
  sources: docs/WHAT-IS-MCP.md, docs/MCP-AGENT-GUIDE.md, packages/cerulean-mcp
---
# Cerulean MCP

MCP connects IDE AI to a **deployed** Cerulean instance. The IDE does the thinking; Cerulean stores structure.

## Hard Rules

1. **Never auto-accept patches** — promotion creates pending patch; user accepts via web or `cerulean_accept_patch`.
2. **Save conversation** — after meaningful exchanges: `cerulean_add_message` for user and assistant turns.
3. **Capture insights** — when an idea is worth keeping: `cerulean_add_insight`.
4. **Promote on request** — `cerulean_promote_insight` or `cerulean_promote_text`.
5. **API key = one user** — keys cannot access other users' data.

## Setup

```bash
cd packages/cerulean-mcp
npm install && npm run build
```

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cerulean": {
      "command": "node",
      "args": ["/absolute/path/to/Cerulean/packages/cerulean-mcp/dist/index.js"],
      "env": {
        "CERULEAN_URL": "https://your-app.railway.app",
        "CERULEAN_API_KEY": "cer_..."
      }
    }
  }
}
```

Generate key: Cerulean web → Settings → MCP / CLI Access.

## Session start

1. `cerulean_verify_connection`
2. `cerulean_get_workspace` — messages, insights, document, pending patch

## Typical flow

```
Explore idea in IDE → respond
→ cerulean_save_chat_turn or cerulean_add_message
→ cerulean_add_insight (if worth capturing)
User: "promote to document"
→ cerulean_promote_insight / cerulean_promote_by_search
→ cerulean_get_pending_patch
User accepts → cerulean_accept_patch
```

After major changes: `cerulean_sync_graph`.

## Key tools

| Category | Tools |
|----------|-------|
| Workspace | `cerulean_get_workspace` |
| Chat | `cerulean_list_messages`, `cerulean_add_message` |
| Insights | `cerulean_add_insight`, `cerulean_promote_insight`, `cerulean_promote_by_search` |
| Document | `cerulean_get_document`, `cerulean_export_document` |
| Patches | `cerulean_get_pending_patch`, `cerulean_accept_patch`, `cerulean_reject_patch` |
| Graph | `cerulean_sync_graph`, `cerulean_get_graph` |
| AI | `cerulean_run_ai_action` |

Full list: `docs/DEPLOYMENT.md` or `packages/cerulean-mcp/README.md`.

## Impact Report

```markdown
MCP: [setup | workflow | troubleshoot]
Connection: [verified | failed]
Tools used: [list]
Pending patch: [yes | no]
```
