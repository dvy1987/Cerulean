# Cerulean Change Log

Last updated: 2026-07-05 (handoff after agent-loom sync)
Purpose: Shared historical log of repo changes, reviews, and context updates made by AI agents or humans during active collaboration

## How To Use
- Append new entries at the top of `## Entries`.
- Keep each entry concise and factual.
- Include commit hashes after commits are created.
- If work was done without a commit yet, say `Commit: not committed yet`.
- If a change was only analysis or review, log that too if it affected team understanding.
- This file is for recordkeeping and context preservation only.
- This file does not authorize implementation, imply agreement, or imply that any logged item should be acted on.

## Entry Template
```md
### YYYY-MM-DD - Short title
- Author: agent name or human name
- Commit: abc1234
- Summary: one or two lines
- Files:
  - `path/to/file`
  - `path/to/file`
- Notes: optional risks, follow-ups, or user decisions
```

## Entries
<!-- New entries go here, newest first -->

### 2026-07-05 - Thinking Loop v2 gap closure (non-QA)
- Author: Cursor agent
- Commit: not committed yet
- Summary: Closed remaining thinking-loop-v2 spec gaps — proposal UX/copy, 80-char noise gate, source_message_ids on chip save, empty-section UI, RuntimeRequest API on `/api/v1/ai/run`, golden eval tests (16 total), session metrics instrumentation.
- Files:
  - `src/modules/chat/ProposedInsightBar.tsx`
  - `src/lib/ai/post-chat-pipeline.ts`
  - `src/lib/ai/runtime-request.ts`
  - `src/lib/document/classify-section.ts`
  - `src/lib/document/section-status.ts`
  - `src/lib/metrics/session-metrics.ts`
  - `src/modules/document/DocumentPanel.tsx`
  - `tests/golden-thinking-loop.test.mjs`
  - `tests/golden-helpers.mjs`
  - `tests/golden/placement-cases.json`
  - `tests/golden/proposal-cases.json`
- Notes: Manual QA and deploy (Phase 5) still pending user.

### 2026-07-05 - Session handoff (agent-loom sync uncommitted)
- Author: agent
- Commit: 0898d72
- Summary: Refreshed `docs/HANDOFF.md` and shared context for next session. Thinking Loop v2 committed @ `32a1567`; agent-loom sync @ `96f9e73` applied but uncommitted (~20 files). Build + 8 tests pass.
- Files:
  - `docs/HANDOFF.md`
  - `docs/agent-shared-context.md`
  - `docs/agent-change-log.md`
- Notes: Next session options — commit sync, manual QA, Phase 5 deploy, Phase 6 golden tests, optional harness bootstrap.

### 2026-07-05 - Sync agent-loom library @ 96f9e73
- Author: agent
- Commit: 0898d72
- Summary: Applied `agent-loom-sync --apply` from `../agent-loom`. Added 3 harness skills; updated 11 library skills. Preserved `cerulean-*` protected and `knowledge-graph` fork. agent-loom untouched.
- Files:
  - `.agents/agent-loom-sync.json`
  - `.agents/skills/harness-engineering/`
  - `.agents/skills/harness-evolution/`
  - `.agents/skills/harness-generation/`
  - `.agents/skills/{agent-builder,eval-pipeline,memory-handoff,memory-startup,project-orchestrator,project-setup,reality-check,retroactive-project-setup,setup-evaluation,skill-finder,skill-routing}/`
  - `docs/SKILL-INDEX.md`
  - `docs/skill-outputs/SKILL-OUTPUTS.md`
- Notes: Upstream commit `96f9e73`. Add: harness-engineering, harness-evolution, harness-generation. Update: agent-builder, eval-pipeline, memory-handoff, memory-startup, project-orchestrator, project-setup, reality-check, retroactive-project-setup, setup-evaluation, skill-finder, skill-routing.

### 2026-07-05 - Session handoff (Thinking Loop v2 complete in code)
- Author: agent
- Commit: 32a1567
- Summary: Refreshed `HANDOFF.md` and shared context for next session. Phases 0–4 + P0–P3 review fixes done; ~60 uncommitted files; build + 8 tests pass.
- Files:
  - `docs/HANDOFF.md`
  - `docs/agent-shared-context.md`
- Notes: Next session entry points — commit, manual QA, Phase 5 deploy, or Phase 6 golden tests.

### 2026-07-05 - Adversarial review fixes (P0–P3)
- Author: agent
- Commit: 32a1567
- Summary: Fixed duplicate persisted chat messages, unified chat agent + real provider streaming, async post-chat after `done`, server-side `callAI`, insight dedupe, contradiction tray wiring, shared heading match, real module tests, trimmed public dev-ai exports, deprecated `/api/ai/chat`.
- Files:
  - `src/app/api/v1/ai/chat/stream/route.ts`
  - `src/app/api/v1/ai/complete/route.ts`
  - `src/lib/ai/server-call-ai.ts`, `call-ai.ts`, `provider.ts`, `chat-agent.ts`, `post-chat-pipeline.ts`, `index.ts`, `types.ts`, `orchestrator.ts`
  - `src/lib/api/workspace-client.ts`
  - `src/modules/chat/ChatPanel.tsx`
  - `src/modules/insights/InsightTray.tsx`
  - `src/store/contradictionStore.ts`
  - `src/lib/document/heading-match.ts`, `placement.ts`
  - `src/lib/document-templates/change-template.ts`
  - `tests/heading-match.test.mts`
- Notes: `npm run build` and `npm test` pass.

### 2026-07-05 - Thinking Loop v2 full implementation
- Author: agent
- Commit: 32a1567
- Summary: Implemented master plan phases 0–6 in code: AI spine (`/api/v1/ai/chat/stream`, post-chat pipeline), proactive insight bar, Product Spec default + template change, section-aware promotion, Advanced mode, migration 003, tests, onboarding, demo seed.
- Files: `src/lib/ai/*`, `src/lib/document-templates/*`, `src/modules/chat/*`, `src/components/*`, `supabase/migrations/003_document_templates.sql`, `tests/thinking-loop-v2.test.mjs`, docs
- Notes: Deploy still manual. Run migration 003 on Supabase before persisted template features work.

### 2026-07-05 - Session handoff for next agent
- Author: agent
- Commit: not committed yet
- Summary: Refreshed `docs/HANDOFF.md` (pushed state, Thinking Loop v2 phases, Phase 0 file list, dual-AI-path table). Updated `agent-shared-context.md` with approved program and next trigger.
- Files:
  - `docs/HANDOFF.md`
  - `docs/agent-shared-context.md`
- Notes: Next session entry point — user says "start Phase 0" to begin AI spine. Do not implement without explicit ask.

### 2026-07-05 - Agent-loom library sync @ 2a796a7
- Author: agent
- Commit: 5c4a443
- Summary: Synced 104 library skills from upstream (3 new, 101 updated). Protected `cerulean-*`; forked `knowledge-graph` (`.next` exclusion intact). Updated `SKILL-INDEX.md`, shared context, SKILL-OUTPUTS.
- Files:
  - `.agents/skills/` (104 synced)
  - `.agents/agent-loom-sync.json`
  - `docs/SKILL-INDEX.md`
  - `docs/agent-shared-context.md`
  - `docs/skill-outputs/SKILL-OUTPUTS.md`
- Notes: New skills — `svg-creation`, `gsap-animation`, `motion-animation`. Cerulean `ROUTING.md` left unchanged (custom domain layer preserved).

### 2026-07-04 - Thinking Loop v2 master implementation plan
- Author: agent
- Commit: e0a2c02
- Summary: Locked PM decisions (Product Spec default, template change v1, proposal latency OK). Full gap register + 6-phase execution plan in `docs/specs/implementation-master-plan.md`; updated `thinking-loop-v2.md`.
- Files:
  - `docs/specs/implementation-master-plan.md`
  - `docs/specs/thinking-loop-v2.md`
- Notes: Start Phase 0 (AI spine) before capture/templates.

### 2026-07-04 - Thinking Loop v2 product spec
- Author: agent
- Commit: e0a2c02
- Summary: Wrote combined spec + phased implementation plan for proactive insight capture, template-first documents, and runtime agent consolidation (Advanced mode).
- Files:
  - `docs/specs/thinking-loop-v2.md`
- Notes: Prerequisite: AI spine (orchestrator-only web path). Program target ~5 weeks in four phases.

### 2026-07-04 - Rebuild knowledge graph (full repo)
- Author: agent
- Commit: 16588ca
- Summary: `build_graph.py --force` — 258 nodes, 305 edges, skill-library mode; 106 skills, 99 modules, 29 docs.
- Files:
  - `docs/knowledge-graph/graph.json`
  - `docs/knowledge-graph/GRAPH_INDEX.md`
  - `docs/knowledge-graph/GRAPH_REPORT.md`
  - `docs/knowledge-graph/call-graph.json`
  - `docs/knowledge-graph/manifest.json`
- Notes: Post agent-loom sync; `.next` excluded from scan.

### 2026-07-04 - Apply agent-loom library sync
- Author: agent
- Commit: 16588ca
- Summary: Applied `agent-loom-sync --apply` (101 skills @ upstream `c97a3df`). Restored `.next` in `build_graph.py` SKIP_DIRS. Merged ROUTING (agent-loom-sync row) and aligned SKILL-INDEX with upstream.
- Files:
  - `.agents/skills/` (101 updated)
  - `.agents/agent-loom-sync.json`
  - `.agents/skills/knowledge-graph/scripts/build_graph.py`
  - `.agents/ROUTING.md`
  - `docs/SKILL-INDEX.md`
- Notes: `cerulean-*` skills unchanged (protected). Rebuild knowledge graph optional.

### 2026-07-04 - Add agent-loom-sync skill
- Author: agent
- Commit: 16588ca
- Summary: Copied `agent-loom-sync` from agent-loom; bootstrapped `.agents/agent-loom-sync.json`; marked `cerulean-*` skills `origin: project-local`; dry-run shows 101 library skills to update @ upstream `c97a3df` (not applied).
- Files:
  - `.agents/skills/agent-loom-sync/`
  - `.agents/agent-loom-sync.json`
  - `.agents/skills/cerulean-{project,deployment,mcp}/SKILL.md`
  - `AGENTS.md`
  - `docs/SKILL-INDEX.md`
- Notes: Re-apply `.next` exclusion in `knowledge-graph/scripts/build_graph.py` after sync if overwritten. Say "apply sync" to run `--apply`.

### 2026-07-04 - Sync skill updates from agent-loom
- Author: Cursor agent
- Commit: 356cae7
- Summary: No new skill folders in agent-loom (Cerulean already had all 102). Rsync'd updated skill files from loom — notably knowledge-graph v2.2 (full-repo TS/Python scan). Added docs/skill-graph.md and docs/SKILL-EXAMPLES-INDEX.md. Preserved cerulean-* domain skills.
- Files:
  - `.agents/skills/` (bulk update)
  - `docs/skill-graph.md`, `docs/SKILL-EXAMPLES-INDEX.md`, `docs/SKILL-INDEX.md`
- Notes: agent-loom folder untouched.

### 2026-07-04 - Lean AGENTS.md merge from agent-loom
- Author: Cursor agent
- Commit: c1f683d
- Summary: Compressed AGENTS.md to ≤200 lines per project-setup/retroactive guidance. Merged agent-loom skill loading, security invariant, orchestration map, boundaries. Moved verbose Cerulean rules to cerulean-project/references/agents-extended.md — no content loss.
- Files:
  - `AGENTS.md`
  - `.agents/skills/cerulean-project/SKILL.md`
  - `.agents/skills/cerulean-project/references/agents-extended.md`
- Notes: Cerulean objectives preserved; detail lives in skill reference per agent-loom pattern.

### 2026-07-04 - Sync agent skills from agent-loom
- Author: Cursor agent
- Commit: db4c445
- Summary: Copied `.agents/` from agent-loom (102 skills, no symlinks). Added Cerulean domain skills: cerulean-project, cerulean-deployment, cerulean-mcp. Bridged docs/memory/ with existing HANDOFF and shared context. Merged skill invocation into AGENTS.md without removing Cerulean rules.
- Files:
  - `.agents/` (105 skills + ROUTING.md)
  - `.agents/skills/cerulean-{project,deployment,mcp}/`
  - `docs/SKILL-INDEX.md`, `docs/memory/`, `docs/skill-outputs/`
  - `AGENTS.md`, `docs/HANDOFF.md`, `README.md`
- Notes: Cerulean had no pre-existing `.agents/` skills — zero regression on skill files. AGENTS.md Cerulean-Specific Rules preserved intact.

### 2026-07-04 - Handoff documentation
- Author: Cursor agent
- Commit: 5819898
- Summary: Created `docs/HANDOFF.md` (architecture, file map, deploy checklist, quirks, next work). Updated README with quick start. Refreshed `agent-shared-context.md` with resolved questions and unpushed commit state. Added HANDOFF to AGENTS.md key references.
- Files:
  - `docs/HANDOFF.md`
  - `README.md`
  - `docs/agent-shared-context.md`
  - `AGENTS.md`
- Notes: Three feature commits (`0547638`–`15c06c7`) still not pushed to origin.

### 2026-07-04 - Remove MCP node_modules from version control
- Author: Cursor agent
- Commit: a6313e7
- Summary: Fixed accidental commit of `packages/cerulean-mcp/node_modules` and `dist/`; updated `.gitignore`.
- Files:
  - `.gitignore`
- Notes: Run `npm install && npm run build` inside `packages/cerulean-mcp` after clone.

### 2026-07-03 - Review fixes: username auth, persistence gaps, MCP sync, tests
- Author: Cursor agent
- Commit: 0547638
- Summary: Addressed adversarial review findings — username/password auth with `profiles.username` migration, server AI context from DB, locked `/api/ai/chat`, chat save-once, graph/settings/exemplar persistence, rate limits on API keys, MCP `cerulean_sync_graph`, simplified docker-compose, smoke tests. `npm run build` passes.
- Files:
  - `supabase/migrations/002_username_and_fks.sql`
  - `src/app/api/auth/*`, `src/lib/auth/*`, `src/lib/ai/context-from-db.ts`
  - `src/lib/api/workspace-client.ts`, `src/hooks/useWorkspaceSync.ts`
  - `src/modules/settings/SettingsPanel.tsx`, `ExemplarUpload.tsx`, `GraphView.tsx`
  - `packages/cerulean-mcp/src/client.ts`, `tools.ts`
  - `docker-compose.yml`, `tests/smoke.test.mjs`, `docs/DEPLOYMENT.md`
- Notes: Middleware allows all `/api/*` without redirect (routes enforce auth). Orchestrator still bypassed for main chat streaming (IDE-first).

### 2026-07-03 - Supabase persistence, auth, REST API, MCP server
- Author: Cursor agent
- Commit: 0547638
- Summary: Full stack for Railway + self-hosted Supabase: Postgres schema with RLS, user auth, API keys for MCP, REST API v1 mirroring all UI operations, web UI persistence layer, Cerulean MCP server package with 30 tools for Cursor/Antigravity.
- Files:
  - `supabase/migrations/001_initial_schema.sql`
  - `src/lib/supabase/`, `src/lib/auth/`, `src/lib/db/workspace-service.ts`
  - `src/app/api/v1/**`, `src/middleware.ts`, `src/app/login/page.tsx`
  - `src/lib/api/workspace-client.ts`, `src/hooks/useWorkspaceSync.ts`
  - `packages/cerulean-mcp/`
  - `docs/DEPLOYMENT.md`, `docs/MCP-AGENT-GUIDE.md`, `docker-compose.yml`, `.env.example`
  - Updated UI modules for persistence sync
- Notes: Without Supabase env vars, app still runs in-memory locally. MCP requires deployed instance + API key.

### 2026-03-22 - AI provider abstraction layer (Gemini, OpenAI, Anthropic)
- Author: Amp agent
- Commit: not committed yet
- Summary: Created a provider abstraction that supports Gemini, OpenAI, and Anthropic APIs. Added a Next.js API route for server-side API calls (keeps keys secret). Updated chat agent to try the real provider first, falling back to dev-ai. Updated `.env.example` with all three provider keys + model overrides. Auto-detects provider based on which key is set (priority: Gemini > OpenAI > Anthropic > dev). Build passes clean.
- Files:
  - `src/lib/ai/provider.ts` — provider abstraction (callProvider, detectProviderConfig)
  - `src/app/api/ai/chat/route.ts` — Next.js API route for server-side AI calls
  - `src/lib/ai/agents/chat-agent.ts` — updated to try real provider, fallback to dev-ai
  - `.env.example` — updated with Gemini, OpenAI, Anthropic keys + model overrides
  - `docs/agent-change-log.md` — this entry

### 2026-03-21 - Full multi-agent build complete + ESLint fixes + roadmap item
- Author: Amp agent
- Commit: not committed yet
- Summary: Built complete multi-agent AI architecture. Fixed ESLint unused-variable errors. Added Memory Management UI as a roadmap item in PRD. Updated shared context to reflect fully implemented state. Production build passes clean.
- Files:
  - `src/lib/ai/agents/insight-extraction-agent.ts` — removed unused `_context` param
  - `src/lib/ai/agents/knowledge-graph-agent.ts` — removed unused `uuidv4` import
  - `src/lib/ai/orchestrator.ts` — removed unused `AgentContext`, `AgentId` imports
  - `docs/PRD.md` — added Memory Management UI roadmap item
  - `docs/agent-shared-context.md` — updated to reflect fully implemented state
  - `docs/agent-change-log.md` — this entry

### 2026-03-21 - Wired multi-agent system into app (index.ts + DocumentBlockView AI menu)
- Author: Amp agent
- Commit: not committed yet
- Summary: Updated `src/lib/ai/index.ts` to register all 10 agents via side-effect imports and re-export both orchestrator (`runAiAction`) and backward-compatible dev-ai functions. Added AI expansion menu to `DocumentBlockView` — hover shows "AI" button with dropdown (Expand argument, Add example, Add counterpoint, Clarify language) that calls `runAiAction` with `document.expand` action and creates a pending patch. All existing UI components remain unchanged (they still import from `@/lib/ai` and get the same functions). `npx tsc --noEmit` passes cleanly.
- Files:
  - `src/lib/ai/index.ts` — side-effect agent imports + runAiAction export
  - `src/modules/document/DocumentBlockView.tsx` — AI expansion menu with orchestrator integration
- Notes: Existing components (ChatPanel, ThinkingSuggestions, InsightTray, DocumentImport) required no changes — they continue using the direct dev-ai function exports.

### 2026-03-21 - Implemented 4 analysis/background agent implementations (suggestion, knowledge-graph, ranking, tonal-adjustment)
- Author: Amp agent
- Commit: not committed yet
- Summary: Created 4 agent files for analysis/background agents. Suggestion agent wraps generateThinkingSuggestions + detectContradictions. Knowledge Graph agent handles both graph.update and insight.detect_contradictions with input-shape dispatch. Ranking agent wraps computeRelevanceScores. Tonal Adjustment agent has new dev-mode logic for match_document and user_directed modes. Fixed Map iteration issue in ranking-agent (used forEach instead of for-of to avoid downlevelIteration). All files compile cleanly.
- Files:
  - `src/lib/ai/agents/suggestion-agent.ts` — suggestion agent (suggestion.generate)
  - `src/lib/ai/agents/knowledge-graph-agent.ts` — knowledge_graph agent (graph.update, insight.detect_contradictions)
  - `src/lib/ai/agents/ranking-agent.ts` — ranking agent (ranking.score)
  - `src/lib/ai/agents/tonal-adjustment-agent.ts` — tonal_adjustment agent (tone.adjust)
- Notes: All 11 agents now have implementations. The previous entry's note about a pre-existing ranking-agent.ts error is now resolved (the ranking agent was created fresh here with the correct Map iteration pattern).

### 2026-03-21 - Implemented 4 core agent implementations (chat, document-integration, document-expansion, insight-extraction)
- Author: Amp agent
- Commit: not committed yet
- Summary: Created 4 agent files that wrap existing dev-ai.ts functions, register with agentRegistry, and define system prompts. Chat agent handles chat.respond (streaming) and insight.to_prompt. Document Integration agent handles document.promote. Document Expansion agent handles document.expand with new simulated expansion logic (4 operation types). Insight Extraction agent handles insight.extract. All 4 files compile cleanly.
- Files:
  - `src/lib/ai/agents/chat-agent.ts` — chat agent (chat.respond, insight.to_prompt)
  - `src/lib/ai/agents/document-integration-agent.ts` — document_integration agent (document.promote)
  - `src/lib/ai/agents/document-expansion-agent.ts` — document_expansion agent (document.expand)
  - `src/lib/ai/agents/insight-extraction-agent.ts` — insight_extraction agent (insight.extract)
- Notes: Pre-existing error in ranking-agent.ts (Map iteration + downlevelIteration) unrelated to this work.

### 2026-03-21 - Implemented memory-management and exemplar-learning agents
- Author: Amp agent
- Commit: not committed yet
- Summary: Created first two agent implementations that register with agentRegistry. Memory Management Agent handles memory compaction and learning promotion across 4 triggers. Exemplar Learning Agent extracts quality learnings from exemplars and routes them to target agents. Both pass `npx tsc --noEmit`.
- Files:
  - `src/lib/ai/agents/memory-management-agent.ts` — memory_management agent
  - `src/lib/ai/agents/exemplar-learning-agent.ts` — exemplar_learning agent
- Notes: These are the first agents registered in the system. Both are dev-mode (simulated) implementations. The orchestrator can now route `memory.manage` and `exemplar.learn` actions to actual agent code.

### 2026-03-21 - Built multi-agent AI architecture foundation
- Author: Amp agent
- Commit: not committed yet
- Summary: Created the foundational code for the 11-agent multi-agent architecture: agent type system, discriminated action union, context snapshot builder, agent registry, dev-mode rule-based router, background agent scheduler, orchestrator entry point, and two new Zustand stores (aiSettingsStore, memoryStore). All files compile cleanly (`npx tsc --noEmit` passes).
- Files:
  - `src/lib/ai/types.ts` — AgentId, WorkspaceSnapshot, AgentContext, AgentResult, AgentDefinition
  - `src/lib/ai/actions.ts` — AiAction discriminated union (12 action types) + result types
  - `src/lib/ai/context.ts` — buildAgentContext() snapshot builder
  - `src/lib/ai/registry.ts` — AgentRegistry singleton
  - `src/lib/ai/dev-router.ts` — rule-based action→agent routing (dev mode)
  - `src/lib/ai/background.ts` — scheduleBackgroundAgents() non-blocking scheduler
  - `src/lib/ai/orchestrator.ts` — runAiAction() main entry point
  - `src/store/aiSettingsStore.ts` — background agent toggle settings
  - `src/store/memoryStore.ts` — document memories, generalized learnings, exemplars
- Notes: No agents are registered yet — agents will be implemented as separate files that call agentRegistry.register(). The existing dev-ai.ts functions remain untouched and still exported from index.ts.

### 2026-03-21 - Finalized multi-agent architecture decisions (11 agents)
- Author: Amp agent
- Commit: not committed yet
- Summary: User made key architecture decisions: LLM-based orchestrator routing, hub-and-spoke communication, background agents with Settings toggle, Tonal Adjustment dual-mode, dedicated Exemplar upload UI, per-document + generalized agent memory (markdown), new Memory Management Agent (11th agent). Updated all docs.
- Files:
  - `AGENTS.md` — updated to 11 agents, added architecture decisions (routing, communication, background, memory)
  - `docs/PRD.md` — updated §22 to 11 agents, added Architecture Decisions, Settings, Exemplar Upload UI, Roadmap Ideas sections
  - `docs/agent-shared-context.md` — added all user decisions, updated agent count, added new open questions
  - `docs/agent-change-log.md` — this entry
- Notes: Settings and Exemplar Upload UI are new product surfaces. Memory management UI deferred. LLM provider choice deferred by user.

### 2026-03-21 - Documented multi-agent AI architecture (initial 10 agents, Google ADK)
- Author: Amp agent
- Commit: not committed yet
- Summary: Identified 13 AI jobs in Cerulean, analyzed tradeoffs, merged to 10 agents (user approved). Documented architecture in AGENTS.md, PRD §22, and agent-shared-context.md including full tradeoff rationale.
- Files:
  - `AGENTS.md` — added Multi-Agent AI Architecture table and merge rationale
  - `docs/PRD.md` — replaced §22 "AI Prompt Systems" with "AI Agent Architecture"
  - `docs/agent-shared-context.md` — added user decisions, tradeoff analysis section, open questions, decision log entries
  - `docs/agent-change-log.md` — this entry
- Notes: Subsequently updated to 11 agents in the next entry.

### 2026-03-21 - Standardized repo with template-based shared docs
- Author: Amp agent
- Commit: not committed yet
- Summary: Merged template AGENTS.md with Cerulean-specific content. Created `agent-shared-context.md`, `agent-change-log.md`, and `surprise.md` from templates with project-specific context filled in.
- Files:
  - `AGENTS.md`
  - `docs/agent-shared-context.md`
  - `docs/agent-change-log.md`
  - `docs/surprise.md`
- Notes: Template files at `C:\Users\reall\Building_Apps\Misc\standard-files\` were not modified.
