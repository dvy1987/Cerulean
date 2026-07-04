---
name: cerulean-project
description: >
  Cerulean product and codebase conventions. Load when working in the Cerulean
  repo, implementing features in chat/insights/document/graph modules, handling
  document blocks, patches, insights, the three-panel workspace, Zustand stores,
  workspace API, Supabase persistence, or Cerulean's 11-agent AI architecture.
  Takes priority over generic project skills for Cerulean-specific work.
license: MIT
metadata:
  author: dvy1987
  version: "1.0"
  category: domain
  sources: AGENTS.md, docs/HANDOFF.md, docs/PRD.md
  resources:
    references:
      - conventions.md
---
# Cerulean Project

You are working in **Cerulean** — a thinking workspace: Exploration → Insight Capture → Structured Composition.

## Hard Rules

- **Repo stability:** Do not refactor modules, rename folders, or restructure unless explicitly asked.
- **Module boundaries:** chat → `/src/modules/chat`, insights → `insights`, document → `document`, graph → `graph`. Shared code → `/src/components`, `/src/lib`, `/src/store`, `/src/types`.
- **Document blocks only:** Never store documents as a single text field. Each block has `block_id`, `block_type`, `content`, `linked_insights`, `source_messages`.
- **Core entities:** Conversation, Insight, Document, DocumentBlock — do not add new core entities without necessity.
- **Incremental loop:** Chat → Capture Insight → Promote → Document. Build the smallest working slice first.
- **AI path:** All AI integrations go through `/src/lib/ai`. Do not call providers directly from UI components.
- **Dual mode:** `isPersistenceEnabled()` gates Supabase vs in-memory. Always branch persistence paths when touching stores.
- **User is a PM:** Explain tradeoffs plainly; own technical decisions unless they affect product direction.

## Three Panels

| Panel | Module | Stage |
|-------|--------|-------|
| Left | Chat | Exploration |
| Right | Document | Structured composition |
| Bottom | Insight Tray | Insight capture |

## Persistence (when Supabase configured)

- UI writes via `workspaceApi` in `src/lib/api/workspace-client.ts`
- Server routes use `WorkspaceService` filtered by `userId`
- Auth: username/password web login; MCP uses `cer_...` API keys
- Read `docs/HANDOFF.md` for architecture before major changes

## Multi-Agent AI (11 agents)

Orchestrator + 10 specialized agents in `/src/lib/ai/agents/`. Hub-and-spoke only — agents never talk directly. Background agents (KG, ranking, suggestion, tonal) toggleable in Settings.

**Code reality:** Orchestrator routing is rule-based (`dev-router.ts`) today; LLM routing is the target.

## UI Philosophy

Minimal cerulean theme — calm, single font, subtle AI-change highlights, no dashboard clutter.

## Key References

- `AGENTS.md` — full Cerulean rules (this skill does not replace it)
- `docs/HANDOFF.md` — architecture and file map
- `docs/agent-shared-context.md` — current state
- `docs/PRD.md` — product vision

## Workflow

1. Read `docs/agent-shared-context.md` before substantial work.
2. Identify the correct module; modify only necessary files.
3. If persistence enabled, wire through `workspaceApi` — do not write to Supabase from components directly.
4. After changes: update `docs/agent-change-log.md`; update shared context if repo-wide understanding changed.

## Impact Report

```markdown
Cerulean work: [task]
Module(s): [chat | insights | document | graph | settings | lib]
Persistence path: [api | local-only | both]
Files touched: [list]
```
