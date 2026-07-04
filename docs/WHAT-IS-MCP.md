# What is MCP? (Plain English)

This guide is for you — no engineering jargon required.

---

## The problem MCP solves

You're in **Cursor** or **Antigravity**, chatting with an AI about product ideas.

You also use **Cerulean** to save insights and build documents.

Without MCP, those are **two separate worlds**. You copy-paste between them.

**MCP connects them.** The AI in your IDE can talk directly to Cerulean — save insights, promote ideas to your document, all while you chat.

---

## The restaurant analogy

Think of three roles:

| Role | In our setup | What it does |
|------|----------------|---------------|
| **You** | You | Order what you want ("save this idea", "promote that insight") |
| **Waiter** | Cursor / Antigravity AI | Understands you, knows what's on the menu |
| **Kitchen** | Cerulean (on Railway) | Actually stores your data — insights, document, chat |

**MCP is the menu + order system** between the waiter and the kitchen.

The waiter (IDE AI) doesn't cook. It reads the menu (list of Cerulean tools), takes your order, and sends it to the kitchen (Cerulean API).

---

## What is an "MCP server"?

It's a **small program that runs on your computer** in the background while Cursor is open.

```
Your computer:
  Cursor opens → starts cerulean-mcp → MCP server waits for orders

When you chat:
  You: "Save that as an insight"
  Cursor AI: calls cerulean_add_insight tool
  MCP server: sends request to Railway with YOUR API key
  Cerulean: saves insight to YOUR database only
  Cursor AI: "Done — insight saved"
```

You don't interact with the MCP server directly. Cursor manages it.

---

## What's a "tool"?

Each tool is **one action** Cerulean can do. Examples:

- `cerulean_add_insight` — save an idea
- `cerulean_promote_by_search` — "promote the insight about onboarding"
- `cerulean_get_workspace` — show me everything I have
- `cerulean_accept_patch` — apply a pending document change

The IDE AI picks the right tool based on what you say.

We built **35+ tools** so the AI can do everything you can do in the Cerulean website.

---

## What's an API key? (Your lock and key)

When you generate an API key in Cerulean Settings:

- It's like a **personal password** for MCP
- It starts with `cer_`
- It only unlocks **your** workspace
- Someone else's key cannot see your documents

You put it in Cursor's config once. Cursor sends it with every request.

---

## What makes our MCP "robust"?

Not trivial — we added real engineering:

| Feature | Why it matters |
|---------|----------------|
| **Startup check** | Verifies your key works before you start working |
| **Retries** | If Railway hiccups, it tries again |
| **Timeouts** | Won't hang forever if the server is down |
| **Clear errors** | "Your API key is wrong" instead of cryptic codes |
| **Safe wrappers** | One failed tool doesn't crash the whole server |
| **Helper tools** | `promote_by_search` so you don't need to know insight IDs |
| **save_chat_turn** | Saves user + assistant message in one step |
| **Instructions** | Tells the IDE AI the rules (never auto-accept patches, etc.) |

---

## How to set it up (short version)

1. Deploy Cerulean + Supabase on Railway
2. Sign in → Settings → **Generate API key**
3. Build MCP: `cd packages/cerulean-mcp && npm install && npm run build`
4. Add to Cursor MCP config (see `packages/cerulean-mcp/README.md`)
5. Restart Cursor

Test by asking: *"Use Cerulean to verify my connection"*

---

## What you say vs what happens

| You say | AI likely uses |
|---------|----------------|
| "Save that idea" | `cerulean_add_insight` |
| "Promote the insight about user onboarding" | `cerulean_promote_by_search` |
| "What's in my Cerulean document?" | `cerulean_get_document` |
| "Accept the pending patch" | `cerulean_accept_patch` |
| "Show my insights" | `cerulean_list_insights` |

You talk normally. The AI picks the tools.

---

## Web app still matters

MCP + CLI are great for **doing** things while coding.

The **website** is great for **seeing** things — insight tray, graph, reviewing patches visually.

Same account, same data, both stay in sync.

---

## One sentence summary

**MCP is a translator** that lets the AI inside Cursor speak to Cerulean on your behalf, using your personal key, so you never copy-paste ideas between tools again.
