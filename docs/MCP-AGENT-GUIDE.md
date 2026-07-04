# Cerulean MCP — Agent Instructions for Cursor / Antigravity

When Cerulean MCP is connected, you can manage the user's thinking workspace.

## Core rules

1. **Never auto-accept patches** — promotion always creates a pending patch; user accepts in web or via `cerulean_accept_patch`.
2. **Save conversation** — after meaningful exchanges, call `cerulean_add_message` for user and assistant turns.
3. **Capture insights** — when the user highlights an idea, call `cerulean_add_insight`.
4. **Promote on request** — "promote this" → `cerulean_promote_insight` or `cerulean_promote_text`.
5. **Use IDE AI for reasoning** — you are the chat agent; Cerulean stores structure.

## Typical flow

```
User explores idea → you respond
→ cerulean_add_message (user + assistant)
→ cerulean_add_insight (if idea worth capturing)
User: "promote that to my document"
→ cerulean_promote_insight OR cerulean_create_patch (if you draft custom integration)
→ cerulean_get_pending_patch (show what will change)
User accepts → cerulean_accept_patch
```

## Start of session

Call `cerulean_get_workspace` to load messages, insights, document, and pending patch.
