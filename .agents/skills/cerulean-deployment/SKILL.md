---
name: cerulean-deployment
description: >
  Deploy Cerulean to Railway with self-hosted Supabase. Load when the user asks
  to deploy Cerulean, set up Railway, configure Supabase on Railway, run
  database migrations, set production env vars, or go live with Cerulean.
license: MIT
metadata:
  author: dvy1987
  version: "1.0"
  category: domain
  origin: project-local
  sources: docs/DEPLOYMENT.md, docs/HANDOFF.md
---
# Cerulean Deployment

Target: **Cerulean app on Railway** + **self-hosted Supabase on Railway** (not Supabase Cloud).

## Hard Rules

- Never commit `.env`, API keys, or service role keys.
- Apply SQL migrations in order — never skip `001` before `002`.
- Passwords stay in Supabase Auth — never add password columns to app tables.
- MCP requires a deployed instance with Supabase configured; local in-memory mode is not enough for MCP.

## Deploy Checklist

### 1. Self-hosted Supabase on Railway

Use [official Supabase Docker setup](https://supabase.com/docs/guides/self-hosting/docker) as a multi-service Railway project:

| Service | Purpose |
|---------|---------|
| Postgres | Database |
| GoTrue | Auth |
| PostgREST | REST + RLS |
| Kong (optional) | API gateway |

Run migrations on Postgres:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_username_and_fks.sql`

### 2. Cerulean app env vars

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional AI keys: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (see `.env.example`).

### 3. Railway app settings

- Build: `npm run build`
- Start: `npm start`
- Root: project root (monorepo includes `packages/cerulean-mcp` but app is root Next.js)

### 4. Verify

1. Sign up at `/login` (username + email + password)
2. Sign in with username + password
3. Create document flow: chat → insight → promote → accept patch
4. Settings → Generate API key for MCP

## Local dev without Supabase

Omit Supabase env vars → in-memory mode, no login. Good for UI work only.

## Post-deploy gaps to flag

- Error monitoring not configured (recommend before real users)
- Rate limiting is in-memory (120 req/min) — fine for MVP, revisit at scale

## Impact Report

```markdown
Deployment: [step completed]
Supabase: [configured | pending]
Migrations: [001 | 002 | both]
Cerulean env: [set | missing vars]
Verified login: [yes | no]
```
