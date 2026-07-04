# Memory Routing

Read this file first. Do not load every memory file by default.

| Intent | File | Read when |
|---|---|---|
| Session handoff (primary) | `docs/HANDOFF.md` | New agent/developer; architecture and deploy checklist |
| Living project state | `docs/agent-shared-context.md` | Before major product/architecture decisions |
| Change history | `docs/agent-change-log.md` | After work; before repeating past analysis |
| Resume work | `agent-handoffs.md` | Starting a new session; read latest entry only |
| Current status | `current-state.md` | Need a snapshot of where the project is now |
| Past decisions | `decision-log.md` | Need rationale for a choice |
| Project learnings | `learnings.md` | Known patterns or gotchas |
| Open questions | `open-questions.md` | Blocking question needs resolution |
| Old / superseded | `archived/` | Almost never |

Routing rules:
- Always consult `project-index.md` before reading content files.
- **Cerulean:** `docs/HANDOFF.md` + `docs/agent-shared-context.md` are authoritative alongside `docs/memory/`.
- Prefer the smallest useful slice; do not load full logs by default.
