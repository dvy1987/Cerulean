# Cerulean

A thinking workspace that converts AI conversations into structured documents.

**Exploration → Insight capture → Structured composition**

## Quick start (local, no database)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Data is in-memory only — refreshing clears everything.

## With persistence (Supabase)

1. Copy `.env.example` → `.env.local` and fill Supabase vars
2. Apply migrations in `supabase/migrations/` to your Postgres
3. `npm run dev` → sign up at `/login`

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for Railway deployment.

## MCP (Cursor / Antigravity)

Connect your IDE to a deployed Cerulean instance via API key. See [`docs/WHAT-IS-MCP.md`](docs/WHAT-IS-MCP.md) and [`packages/cerulean-mcp/README.md`](packages/cerulean-mcp/README.md).

## Handoff & docs

| Doc | What |
|-----|------|
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | **Start here** for new agents or developers |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Railway + Supabase setup |
| [`docs/SKILL-INDEX.md`](docs/SKILL-INDEX.md) | All agent skills (105 in `.agents/skills/`) |
| [`.agents/ROUTING.md`](.agents/ROUTING.md) | Skill priority rules |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements |

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm run lint     # ESLint
npm test         # smoke tests
```
