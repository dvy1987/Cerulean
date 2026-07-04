# Agent Handoffs

## 2026-07-04 — Agent skills sync from agent-loom

**Context:** Cerulean predated agent-loom skill library. User requested intelligent merge: copy agent-loom skills (no symlinks), preserve Cerulean-specific knowledge.

**What was done:**
- Copied `.agents/` from agent-loom (102 skills + ROUTING.md)
- Added Cerulean domain skills: `cerulean-project`, `cerulean-deployment`, `cerulean-mcp`
- Bridged `docs/memory/` with existing `docs/HANDOFF.md` and `docs/agent-shared-context.md`
- Merged skill invocation into `AGENTS.md` without removing Cerulean rules

**Cerulean-specific docs preserved (not replaced):**
- `AGENTS.md` Cerulean-Specific Rules section — intact
- `docs/HANDOFF.md`, `docs/agent-shared-context.md`, `docs/agent-change-log.md`
- `docs/DEPLOYMENT.md`, `docs/MCP-AGENT-GUIDE.md`, `docs/WHAT-IS-MCP.md`

**Next agent should:**
1. Read `AGENTS.md` → `docs/HANDOFF.md` → `docs/agent-shared-context.md`
2. On session start: run `memory-startup` (reads this file + project-index)
3. For deploy: use `cerulean-deployment` or `shipping-and-launch`
4. For MCP: use `cerulean-mcp`

**Branch:** `main` (pushed). Working tree may have uncommitted skill sync.
