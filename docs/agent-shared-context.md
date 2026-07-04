# Cerulean Shared Context

Last updated: 2026-07-03
Status: Active working context for humans and AI agents

## Purpose
This document is the shared source of truth for the current state of Cerulean.
Use it to avoid repeating discovery work across agents and threads.
This document is primarily for the user to preserve context and understand the current state of the repo.

Important:
- This file does not authorize implementation.
- This file does not imply user approval, agreement, or prioritization.
- Agents must not treat any statement in this file as permission to start coding.
- Agents may update this file only after:
  - making changes the user asked for, or
  - having a conversation with the user that changes repo-wide understanding

Update this file when:
- product direction changes
- implementation reality changes
- a major assumption is confirmed or disproved

## How To Use This File
- Humans: edit this file freely in plain language.
- AI agents: read this file before making major product, architecture, or design decisions.
- If this file conflicts with older docs, do not make any changes to the older docs based on this file. Just point out the contradiction to the user. Unless the user says so, make no changes to the repo based on this file.
- Agents must treat this as informational context only, not as advice, an execution queue, or an approved plan.

## Project Snapshot
- Project: Cerulean
- Purpose: A thinking workspace that converts AI conversations into structured documents
- Deadline: No hard deadline
- Build style: MVP — one polished experience over feature breadth

## Tech Stack Summary
<!-- Keep this in sync with AGENTS.md. Quick reference for agents. -->
- Frontend: Next.js 14 (React 18, TypeScript)
- Styling: Tailwind CSS
- State Management: Zustand
- Database: Supabase Postgres (when env configured) + in-memory fallback locally
- AI/ML: Multi-agent architecture via Google ADK (11 agents). Dev AI mode for now; all AI goes through `/src/lib/ai`
- Hosting: TBD
- Key dependencies: next 14.2.35, react 18, zustand 5, uuid 13

## User Decisions & Clarifications
- 2026-03-21: User decided to use a multi-agent architecture (Google ADK) for all AI functions — each agent gets a focused system prompt and minimal context window for independent tuning, isolated troubleshooting, and continuous improvement
- 2026-03-21: User approved merging 13 initially-identified AI jobs into 10 agents, then added Memory Management Agent → final count: 11 agents
- 2026-03-21: Orchestrator uses LLM-based routing (not hardcoded rules)
- 2026-03-21: Hub-and-spoke communication — all agents talk through orchestrator, never directly to each other
- 2026-03-21: Background agents (KG, Ranking, Suggestion, Tonal Adjustment on promoted content) run automatically but user can toggle them off via Settings
- 2026-03-21: Tonal Adjustment runs in two modes — background (matches existing document tone for promoted content) and on-demand (user provides description or example)
- 2026-03-21: Exemplar Learning Agent gets a dedicated upload UI. Roadmap idea (not decided): pasting exemplar text into chat
- 2026-03-21: Agent memory is per-document + generalized cross-document learnings, managed by Memory Management Agent, stored as markdown files. Memory UI deferred.

## Current Reality In Code

### What is implemented
- Project scaffolding: Next.js 14 + TypeScript + Tailwind
- Three-panel workspace layout with Settings + Exemplar buttons
- Chat, insights, document, graph modules (UI complete)
- Multi-agent AI architecture (dev mode + optional real providers)
- **Username + password auth** — sign up with username/email/password; sign in with username/password. Passwords in Supabase Auth only; `profiles` stores username.
- **Supabase persistence layer** — schema, RLS, auth, REST API v1
- **API keys** for MCP/CLI — per-user, hashed at rest
- **MCP server** — `packages/cerulean-mcp` with 35+ tools (full UI parity incl. `cerulean_sync_graph`)
- Web UI syncs to Supabase when env vars are configured; falls back to in-memory without them
- Graph, settings toggles, exemplar delete persist when Supabase enabled

### What is NOT yet implemented
- Railway + self-hosted Supabase deployment (documented in `docs/DEPLOYMENT.md`, not automated)
- LLM-based orchestrator routing (still rule-based dev-router)
- Memory management UI
- Automated insight extraction on every chat turn (MCP/IDE must call tools)
- Comprehensive test suite (only smoke tests for hashing/username validation)

### Deployment
- Target: Railway (app) + self-hosted Supabase on Railway (not Supabase Cloud)
- MCP connects via `CERULEAN_URL` + `CERULEAN_API_KEY`
- See `docs/DEPLOYMENT.md` and `packages/cerulean-mcp/README.md`

### What is implemented differently than docs suggest
- PRD and master-prompt reference TipTap editor and dnd-kit, but neither is in `package.json` — document editing is custom
- Graph persists to Supabase when env configured (was in-memory only in older docs)

## Important Findings

### Strengths
- Clean modular architecture aligned with the three-stage thinking model
- Clear separation of concerns across modules (chat, insights, document, graph)
- AI abstraction layer is in place for easy provider swap later

### Gaps & Risks
- Without Supabase env vars, all state is ephemeral (local dev mode)
- Test coverage is minimal

## Multi-Agent Architecture — Tradeoff Analysis
This section records the reasoning behind the 10-agent structure. It is context for future agents, not an execution plan.

### Why multi-agent?
- Minimizes system prompt and context window per LLM call → lower cost, lower latency
- Each agent can be tuned/optimized independently
- Malfunctions are isolated to one agent → easier troubleshooting
- Enables continuous improvement per agent via the Exemplar Learning Agent

### 13 AI jobs were initially identified:
1. Conversational AI (Chat) 2. Document Integration (Promotion) 3. Document Expansion (Editing Assist) 4. Tonal Adjustment 5. Insight Extraction (Document Import) 6. Insight Suggestion (from Conversation) 7. Thinking Suggestions (Next Topic) 8. Contradiction Detection 9. Insight-to-Prompt Generation 10. Insight Relevance Ranking 11. Knowledge Graph Creation & Maintenance 12. Exemplar Learning 13. Orchestration

### Final count: 11 agents (13 → 10 via merges, then +1 Memory Management Agent)

### Three merges were made (13 → 10):
- **Insight Suggestion + Thinking Suggestions → Suggestion Agent**: Both read the same context (conversation, insights, document gaps). Separate agents would duplicate context loading for nearly identical reasoning.
- **Contradiction Detection → into Knowledge Graph Agent**: KG agent already classifies relationships as supports/contradicts/expands. Contradiction detection is a byproduct — a separate agent would re-read the same graph.
- **Insight-to-Prompt → into Chat Agent**: Converting an insight title into a chat prompt is too lightweight for its own agent, system prompt, and failure isolation overhead.

### What was kept separate and why:
- **Document Integration vs. Document Expansion**: Different prompt engineering (placement + merging vs. elaborating existing content). Independent tuning value justifies the split.
- **Tonal Adjustment**: Needs style exemplars and has a fundamentally different job (style transfer without content change). Distinct enough to warrant isolation.
- **Insight Relevance Ranking**: Output is a ranked list vs. KG's graph updates — different enough to keep separate, though borderline.
- **Exemplar Learning**: Meta-level agent that feeds other agents. Completely unique job.

## Current Context Notes
This section records current observations about the repo.
It is not advice, not a recommended plan, and not a task list for autonomous execution.

- The repo was recently standardized with template-based AGENTS.md and shared docs
- The core UI skeleton and module structure exist; feature depth within each module needs assessment
- Multi-agent architecture is fully implemented in TypeScript (11 agent roles, 10 agent files — orchestrator is in orchestrator.ts, not a separate agent file)
- Settings UI and Exemplar Upload UI are implemented and accessible from the top bar
- Document blocks now have an AI expansion menu (expand argument, add example, add counterpoint, clarify language)
- All agents run in dev mode with simulated responses; swapping to real LLM providers requires updating the agent run functions

## Collaboration Rules For Agents
- Read this file and `docs/agent-change-log.md` before substantial work.
- Update this file when you learn something that changes repo-wide understanding.
- Keep sections short and current. Replace outdated statements instead of layering contradictions.
- If you make a product or architecture tradeoff, record:
  - what changed
  - why
  - whether the user approved it
- Do not start implementing anything from this file unless the user explicitly asks for that work in the current conversation.

## Open Questions
<!-- Unresolved decisions or things to figure out. Remove when resolved. -->
- What database will be used when moving past MVP? (PRD/master-prompt mention Supabase)
- When should auth be introduced?
- Should the app work on mobile/tablets?
- Will TipTap and dnd-kit be added as specified in master-prompt, or use a different approach?
- Which LLM provider(s) will back each agent? (PRD mentions OpenAI; Google ADK supports multiple) — user will decide later
- What additional settings should be exposed in Settings beyond background agent toggles?
- Should memory management UI be added? (deferred for now)

## Decision Log
<!-- Timestamped record of key decisions. Append new entries at the bottom. -->
- 2026-03-21: Standardized repo with template-based AGENTS.md and shared doc files
- 2026-03-21: Decided on multi-agent AI architecture using Google ADK — 11 agents (1 orchestrator + 10 specialized)
- 2026-03-21: Approved merging 13 AI jobs → 10 agents, then added Memory Management Agent → 11 total
- 2026-03-21: Orchestrator uses LLM routing, hub-and-spoke communication model
- 2026-03-21: Background agents toggleable via Settings; Tonal Adjustment dual-mode (background + on-demand)
- 2026-03-21: Agent memory: per-document + generalized, stored as markdown, managed by Memory Management Agent
