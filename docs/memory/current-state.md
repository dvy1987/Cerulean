# Current State

**Last updated:** 2026-07-06

## Stack

Next.js 14, TypeScript, Tailwind, Zustand, Supabase Postgres (when configured), MCP server in `packages/cerulean-mcp`.

## Status

- Thinking Loop v2 Phases 0–4 committed (`32a1567`); gap-closure work **uncommitted** on `main`
- `origin/main` @ `5d736bc`; 16 tests pass; build clean
- Username/password auth, REST API v1, MCP 35+ tools
- **Not deployed** to Railway + self-hosted Supabase yet
- Agent skills: 112 (109 library + 3 Cerulean domain)

## Immediate next step

User choice: **commit** gap-closure work · **verify** (manual QA) · **Phase 5 deploy**

## Dual mode

Without `NEXT_PUBLIC_SUPABASE_URL`: in-memory local dev, no login.
With Supabase env: login required, full persistence.

## New since last handoff

- `RuntimeRequest` routes on `/api/v1/ai/run`
- Golden tests in `tests/golden/`
- Session metrics in `src/lib/metrics/session-metrics.ts`
- Section classifier + empty-section UI
