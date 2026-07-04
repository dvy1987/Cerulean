# Cerulean Extended Agent Rules

Moved from `AGENTS.md` to keep the root file ≤200 lines. Load via `cerulean-project` when you need full detail.

## Proactive Agent Behavior

Act as a senior technical partner, not a passive executor.

**Point out what's missing** — crucial info (auth, database), security/performance risks, conflicts with earlier decisions. **Make recommendations** — better approaches, scope creep, future gaps. **Don't be gratuitous** — only flag what matters; if obvious, just do it.

### Timing-Sensitive Engineering Questions

Surface only when relevant. If user postpones, note once in `docs/agent-shared-context.md` Open Questions; do not re-raise unless circumstances change.

| Concern | When to surface |
|---------|-----------------|
| Cost guardrails | First paid API or before deployment |
| Error monitoring | Before first deployment |
| Auth strategy | When users or protected data needed (use Supabase Auth — never custom) |
| Database migrations | Creating first schema |
| Mobile responsiveness | Initial layout — ask once |
| README setup | After working local setup |
| API contract | First frontend-consuming endpoint |

## Multi-Agent AI Architecture (11 agents)

Orchestrator + 10 specialized in `/src/lib/ai/agents/`. Hub-and-spoke — never direct agent-to-agent.

| # | Agent | Responsibility |
|---|-------|----------------|
| 1 | Orchestrator | Routes actions; LLM routing target (today: `dev-router.ts`) |
| 2 | Chat | Conversation + insight-to-prompt |
| 3 | Document Integration | Promote → patch; never full rewrite |
| 4 | Document Expansion | Expand, example, counterpoint, clarify |
| 5 | Tonal Adjustment | Match document tone; on-demand style changes |
| 6 | Insight Extraction | Upload docs → tray insights |
| 7 | Suggestion | Insight + thinking suggestions |
| 8 | Knowledge Graph | Nodes, edges, contradictions |
| 9 | Insight Relevance Ranking | Rank tray by document relevance |
| 10 | Exemplar Learning | Quality examples → agent learnings |
| 11 | Memory Management | Per-document + generalized memories (markdown) |

Background agents (KG, ranking, suggestion, tonal on promote) toggleable in Settings.

**Merge rationale:** Suggestion+Thinking→Suggestion; Contradiction→KG; Insight-to-Prompt→Chat.

## Prompt Crafting

Distill user stream-of-consciousness into concise prompts. Preserve intent; compress redundancy. Every sentence must earn its place — bloated prompts add latency/cost; stripped prompts lose user feedback.

## PRD Workflow

On first encounter with `docs/PRD.md`: read thoroughly, assess feasibility, identify gaps, ask user, update PRD, do not build until clear.

## Document Hygiene

Shared files (`agent-shared-context.md`, `agent-change-log.md`, `surprise.md`) — short, factual, no filler. Compress when >~300 lines. Never duplicate across files; replace outdated info.

## Multi-Agent Collaboration

- `docs/agent-shared-context.md` — informational only, not permission to execute
- `docs/agent-change-log.md` — record changes + commit hashes
- `docs/surprise.md` — genuinely surprising discoveries only

**Required workflow:** Read AGENTS.md + shared context + changelog before substantial work. Update changelog after changes; shared context if repo-wide understanding changed. Do not implement from shared docs unless user asks in current thread.

## File Structure

```
Cerulean/
├── .agents/skills/     ← agent skills
├── src/modules/        ← chat, insights, document, graph, settings
├── src/lib/ai/         ← orchestrator + agents
├── src/lib/api/        ← workspace-client
├── packages/cerulean-mcp/
├── supabase/migrations/
└── docs/
```

## AI Development Mode

All AI through `/src/lib/ai`. Optional real providers via env (Gemini/OpenAI/Anthropic). Dev mode works without keys.
