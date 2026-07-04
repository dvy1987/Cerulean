# Cerulean Deployment (Railway + self-hosted Supabase)

## Overview

- **Cerulean app** → Railway (Next.js)
- **Supabase** → Self-hosted on Railway (Postgres + Auth + API) — not Supabase Cloud
- **MCP server** → Runs locally in Cursor/Antigravity, connects to your Railway app with an API key

## 1. Deploy self-hosted Supabase on Railway

Use the [official Supabase Docker setup](https://supabase.com/docs/guides/self-hosting/docker) as a Railway project with multiple services:

| Service | Purpose |
|---------|---------|
| Postgres | Database |
| GoTrue (`auth`) | Authentication |
| PostgREST (`rest`) | REST API + RLS |
| Kong (optional) | API gateway |

Apply migrations in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_username_and_fks.sql`

The `profiles` table stores **username** (unique, case-insensitive). Passwords live in Supabase Auth only — never in app tables.

### Sign up / sign in

- **Sign up:** username + email + password (web UI or `POST /api/auth/signup`)
- **Sign in:** username + password (resolves username → email via `profiles`, then Supabase Auth)

### Required env vars (Cerulean app)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-api.railway.app
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 2. Deploy Cerulean on Railway

1. Connect this repo to Railway
2. Set root directory to project root
3. Add environment variables above + optional AI keys
4. Build command: `npm run build`
5. Start command: `npm start`

## 3. MCP setup (Cursor / Antigravity)

### Step 1: Sign in to Cerulean web app

Create an account at your deployed URL.

### Step 2: Generate API key

Settings → **MCP / CLI Access** → **Generate API key**

Copy the key (`cer_...`) — shown once only.

### Step 3: Build MCP server

```bash
cd packages/cerulean-mcp
npm install
npm run build
```

### Step 4: Add to Cursor MCP config

`~/.cursor/mcp.json` (or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "cerulean": {
      "command": "node",
      "args": ["/absolute/path/to/Cerulean/packages/cerulean-mcp/dist/index.js"],
      "env": {
        "CERULEAN_URL": "https://your-cerulean-app.railway.app",
        "CERULEAN_API_KEY": "cer_your_key_here"
      }
    }
  }
}
```

Restart Cursor. Cerulean tools appear as `cerulean_*`.

## Security model

- **Web login** → Supabase Auth session (cookie). RLS ensures users only see their rows.
- **MCP / CLI** → API key in `Authorization: Bearer cer_...` header.
- API keys are hashed in the database; only the prefix is stored for identification.
- Each API key is tied to one user — **your MCP key cannot access anyone else's data**.

## Typical MCP workflow

1. Chat in Cursor about an idea
2. Ask the agent: *"Save that as a Cerulean insight"*
   → calls `cerulean_add_insight`
3. *"Promote the insight about X to my document"*
   → calls `cerulean_promote_insight` or `cerulean_promote_text`
4. Open Cerulean web app → review pending patch → Accept
5. Or in MCP: `cerulean_accept_patch`

## Available MCP tools

Full parity with the web UI:

| Category | Tools |
|----------|-------|
| Workspace | `cerulean_get_workspace` |
| Chat | `cerulean_list_messages`, `cerulean_add_message`, `cerulean_update_message` |
| Insights | `cerulean_list_insights`, `cerulean_add_insight`, `cerulean_update_insight`, `cerulean_archive_insight`, `cerulean_promote_insight`, `cerulean_promote_text`, `cerulean_extract_insights_from_text`, `cerulean_insight_to_prompt` |
| Document | `cerulean_get_document`, `cerulean_set_document_title`, `cerulean_add_block`, `cerulean_update_block`, `cerulean_remove_block`, `cerulean_export_document` |
| Patches | `cerulean_get_pending_patch`, `cerulean_create_patch`, `cerulean_accept_patch`, `cerulean_reject_patch` |
| Graph | `cerulean_sync_graph`, `cerulean_get_graph`, `cerulean_add_graph_node`, `cerulean_add_graph_edge` |
| Exemplars | `cerulean_list_exemplars`, `cerulean_add_exemplar`, `cerulean_remove_exemplar` |
| Settings | `cerulean_get_settings`, `cerulean_update_settings` |
| AI | `cerulean_run_ai_action` |

## Local development without Supabase

If `NEXT_PUBLIC_SUPABASE_URL` is not set, the app runs in **local-only mode** (in-memory, no login). MCP requires a deployed instance with Supabase configured.
