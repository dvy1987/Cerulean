# Current State

**Last updated:** 2026-07-04

## Stack

Next.js 14, TypeScript, Tailwind, Zustand, Supabase Postgres (when configured), MCP server in `packages/cerulean-mcp`.

## Status

- App built and pushed to GitHub (`main`)
- Username/password auth, REST API v1, MCP 35+ tools
- **Not deployed** to Railway + self-hosted Supabase yet
- Agent skills: 102 from agent-loom + 3 Cerulean domain skills (`cerulean-project`, `cerulean-deployment`, `cerulean-mcp`)

## Immediate next step

Deploy to Railway per `docs/DEPLOYMENT.md` or use `cerulean-deployment` skill.

## Dual mode

Without `NEXT_PUBLIC_SUPABASE_URL`: in-memory local dev, no login.
With Supabase env: login required, full persistence.
