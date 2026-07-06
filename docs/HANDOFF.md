# Cerulean Handoff

**Last updated:** 2026-07-06 (thinking-loop gap closure — **uncommitted**)  
**Branch:** `main` — synced with `origin/main` @ `54b808f`  
**Read first:** `AGENTS.md` → this file → `docs/agent-shared-context.md`

---

## Start next session here

**Status:** Thinking Loop v2 gap-closure **committed and pushed** (`54b808f`). `npm run build` + `npm test` pass (**16 tests**).

**User should say one of:**
- **"verify"** or **"run QA"** — manual QA checklist below (user deferred this)
- **"start Phase 5"** — Railway + Supabase deployment (apply migration `003`)
- **"bootstrap harness"** — optional; run `harness-generation` (no `docs/harness/manifest.json` yet)

### Phase status (master plan)

| Phase | What | Status |
|-------|------|--------|
| **0** | AI spine — web chat through orchestrator | **Done** |
| **1** | Runtime router + Advanced mode | **Done** |
| **2** | Proactive insight capture | **Done** |
| **3** | Template-first docs (`product_spec` default) | **Done** |
| **4** | Unify promote/expand through orchestrator | **Done** |
| **5** | Deploy Railway + Supabase | **Not started** |
| **6** | Golden tests + doc refresh | **Done** (16 tests; golden evals in `tests/golden/`) |

### This session (2026-07-05 → 06)

| Work | Status |
|------|--------|
| Closed thinking-loop-v2 spec gaps (except manual QA + deploy) | Committed (`54b808f`) |
| Proposal bar: spec copy, `source_message_ids`, +N more, noise gate | Done |
| Empty-section UI + `classifyPromotionSection` fallback | Done |
| `RuntimeRequest` on `/api/v1/ai/run` | Done |
| Golden tests (10 placement + 10 proposal cases) | Done |
| Session metrics (`src/lib/metrics/session-metrics.ts`) | Done |
| `npm run build` + `npm test` | Pass (16 tests) |
| Manual QA checklist | **Not run** (user deferred) |
| Git commit / push | Done (`54b808f`) |

### Working tree (uncommitted)

**Modified:** `docs/HANDOFF.md`, `docs/agent-change-log.md`, `ProposedInsightBar.tsx`, `post-chat-pipeline.ts`, `runtime-router.ts`, `DocumentPanel.tsx`, `DocumentBlockView.tsx`, `PatchReview.tsx`, `ChatPanel.tsx`, `InsightTray.tsx`, `workspace-client.ts`, agents, `DocumentTypePicker.tsx`, `proposedInsightStore.ts`, `tests/thinking-loop-v2.test.mjs`, `/api/v1/ai/run/route.ts`

**New:** `src/lib/ai/runtime-request.ts`, `src/lib/document/classify-section.ts`, `src/lib/document/section-status.ts`, `src/lib/insights/proposal-constants.ts`, `src/lib/metrics/session-metrics.ts`, `tests/golden-thinking-loop.test.mjs`, `tests/golden-helpers.mjs`, `tests/golden/*.json`

### Adversarial review fixes (committed in `32a1567`)

| Priority | Issue | Status |
|----------|-------|--------|
| P0 | Duplicate persisted chat messages | Fixed — stream route owns message lifecycle |
| P0 | Server-side AI broken for agents | Fixed — `server-call-ai.ts` + `/api/v1/ai/complete` |
| P1 | Fake streaming | Fixed — `streamProvider()` in `provider.ts` |
| P1 | Two chat brains | Fixed — stream route uses chat agent only |
| P1 | Post-chat blocks stream | Fixed — `done` before `postChat` event |
| P2 | Contradictions hardcoded `[]` | Fixed — `contradictionStore` + post-chat detection |
| P2 | No proposal dedupe | Fixed — dedupe vs existing insights |
| P2 | Tests reimplement logic | Partial — real `heading-match.ts` tests; placement still heuristic in `.mjs` |
| P2 | Zustand in post-chat pipeline | Fixed — client applies results in `workspace-client` |
| P2 | Weak heading match in placement | Fixed — shared `heading-match.ts` with Levenshtein |
| P3 | Public `dev-ai` exports | Fixed — `index.ts` exports orchestrator only |
| P3 | Legacy `/api/ai/chat` | Deprecated — returns 410, use `/api/v1/ai/complete` |

**Locked PM decisions (do not re-litigate):**
- Default document type: **`product_spec`**
- Template change: **ship in v1** (confirm modal)
- Insight proposal latency: **1–3s OK**; never auto-save insights
- Advanced mode: Graph + Exemplar + Import hidden until toggled

---

## Committed history

| Commit | What |
|--------|------|
| `54b808f` | Thinking Loop v2 gap closure — golden tests, RuntimeRequest, metrics (37 files) |
| `5d736bc` | Docs: handoff HEAD pointer (current `origin/main`) |
| `32a1567` | Thinking Loop v2 Phases 0–4 + adversarial P0–P3 fixes (65 files) |
| `0898d72` | Agent-loom sync @ `96f9e73` — harness skills + handoff refresh (34 files) |

**Pending commit:** none — `main` @ `54b808f` synced with origin.

**Before deploy:** apply migration `003` on Postgres (`supabase/migrations/003_document_templates.sql`).

---

## Manual QA checklist

Run with Supabase env configured (`isPersistenceEnabled()` true):

1. **Persisted chat** — send message → exactly 1 user + 1 assistant row (no duplicates)
2. **Streaming** — assistant text streams; "Thinking..." clears on `done` before proposals appear
3. **Proposals** — 0–3 chips in `ProposedInsightBar` after reply; save/dismiss works
4. **Template** — new workspace seeds `product_spec` sections; template change modal works
5. **Promote** — highlight chat text → patch with section label (e.g. "Open Questions")
6. **Contradictions** — 2+ conflicting insights → tray flags after next chat turn
7. **Advanced mode** — Graph/Exemplar/Import hidden until Settings toggle

Run without Supabase (in-memory): same flows via `streamChatLocal` + orchestrator.

Optional demo: `NEXT_PUBLIC_CERULEAN_DEMO_MODE=true` for seeded workspace.

---

## What Cerulean Is

A thinking workspace with three panels:

| Panel | Module | Stage |
|-------|--------|-------|
| Left | Chat | Exploration |
| Right | Document | Structured composition |
| Bottom | Insight Tray | Insight capture |

Users explore in chat, review proposed insights, and promote into structured document blocks.

---

## Architecture (current)

```mermaid
flowchart TB
  subgraph ui [Web UI]
    CP[ChatPanel]
    PIB[ProposedInsightBar]
    DT[InsightTray]
    DP[DocumentPanel]
  end

  subgraph api [API]
    Stream["POST /api/v1/ai/chat/stream"]
    Complete["POST /api/v1/ai/complete"]
    Run["POST /api/v1/ai/run"]
    V1["/api/v1/*"]
  end

  subgraph ai [AI core]
    Orch[orchestrator.ts]
    Post[post-chat-pipeline.ts]
    Agents[Agent registry]
    Dev[dev-ai fallbacks inside agents only]
    Prov[provider.ts stream + complete]
  end

  CP -->|persisted| Stream
  CP -->|local| Orch
  Stream --> Orch
  Stream --> Post
  Agents --> Dev
  Agents --> Prov
  Complete --> Prov
  V1 --> DB[(Supabase)]
```

**Rule enforced:** No `dev-ai` imports in `src/modules/**`. Agents may fall back to `dev-ai` internally.

### Chat stream event sequence (persisted)

1. Server creates user + assistant messages in DB
2. `init` — client adds both to chat store with server IDs
3. `chunk` — streaming tokens; client updates assistant content locally
4. `done` — stream complete; `isStreaming` clears
5. `postChat` — proposals, suggestions, contradictions, ranking scores

### Dual-mode gate

`isPersistenceEnabled()` in `src/lib/config.ts` — requires `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Agent skills (`.agents/skills/`)

- **112 skills** — 109 library + 3 Cerulean domain (`cerulean-project`, `cerulean-deployment`, `cerulean-mcp`)
- **Last sync:** upstream `96f9e73` (committed `0898d72`)
- **New this sync:** harness suite (`harness-engineering`, `harness-generation`, `harness-evolution`)
- **Fork preserved:** `knowledge-graph` (Cerulean `.next` exclusion in `build_graph.py`)
- **Index:** `docs/SKILL-INDEX.md` | **Routing:** `.agents/ROUTING.md`
- **No harness manifest yet** — `docs/harness/manifest.json` does not exist; optional future work via `harness-generation`

---

## Key files

```
Cerulean/
├── docs/
│   ├── HANDOFF.md                          ← you are here
│   ├── specs/implementation-master-plan.md
│   ├── specs/thinking-loop-v2.md
│   ├── DEPLOYMENT.md                       ← includes migration 003
│   ├── agent-shared-context.md
│   └── agent-change-log.md
├── .agents/
│   ├── agent-loom-sync.json                ← sync config @ 96f9e73
│   └── skills/                             ← 112 skills
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_username_and_fks.sql
│   └── 003_document_templates.sql          ← required for templates
├── src/
│   ├── app/api/v1/ai/chat/stream/route.ts  ← persisted chat SSE
│   ├── app/api/v1/ai/complete/route.ts     ← agent completions
│   ├── lib/ai/
│   │   ├── orchestrator.ts
│   │   ├── post-chat-pipeline.ts
│   │   ├── server-call-ai.ts
│   │   ├── provider.ts                     ← streamProvider + callProvider
│   │   └── agents/
│   ├── lib/api/workspace-client.ts         ← streamChat, applyPostChatResults
│   ├── lib/document/
│   │   ├── heading-match.ts
│   │   ├── classify-section.ts      ← promotion section heuristic
│   │   └── section-status.ts      ← empty section detection
│   ├── lib/ai/runtime-request.ts    ← RuntimeRequest → AiAction adapter
│   ├── lib/metrics/session-metrics.ts
│   └── store/contradictionStore.ts
└── tests/
    ├── heading-match.test.mts
    ├── thinking-loop-v2.test.mjs
    ├── golden-thinking-loop.test.mjs
    ├── golden-helpers.mjs
    └── golden/                      ← 10 placement + 10 proposal cases
```

---

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # must pass
npm test             # 16 tests (strip-types + .mjs)
```

With Supabase: copy `.env.example` → `.env.local`, apply migrations 001–003, sign up at `/login`.

---

## What is NOT done

| Item | Notes |
|------|-------|
| **Git commit** | Gap-closure work uncommitted — user should say **"commit"** |
| **Manual QA** | Checklist below not run (user deferred) |
| **Railway deployment** | Phase 5 — `docs/DEPLOYMENT.md` |
| **Agent harness bootstrap** | No `docs/harness/` — optional via `harness-generation` |
| **LLM orchestrator routing** | Still `dev-router.ts` (deferred) |
| **Memory management UI** | Tables exist; UI deferred |
| **Memories API** | No `/api/v1/memories` routes |
| **Gemini streaming** | Falls back to buffered completion |
| **User API keys on server stream** | Server uses env keys; client keys via `/api/v1/ai/complete` only |

---

## For the next agent

1. Read `AGENTS.md`, this file, `docs/agent-shared-context.md`.
2. **Do not commit** unless user asks — tree has uncommitted gap-closure work.
3. **Do not modify** `../agent-loom` — sync is one-way into Cerulean.
4. **Do not refactor** module structure unless asked.
5. If user says **"commit"** — stage all gap-closure files; message should cover thinking-loop-v2 gap closure; update changelog commit hash.
6. If user says **"verify"** — run QA checklist and report findings.
7. If user says **"start Phase 5"** — use `cerulean-deployment`; apply migration `003`.
8. Runtime API: `/api/v1/ai/run` accepts `{ action }` (legacy) or `{ runtime: { route, input } }` — see `src/lib/ai/runtime-request.ts`.
9. Session metrics live in `sessionStorage` key `cerulean_session_metrics_v1` — client-only, no server endpoint yet.

---

## Doc index

| Doc | Purpose |
|-----|---------|
| `docs/HANDOFF.md` | Session handoff (this file) |
| `docs/specs/implementation-master-plan.md` | Phase plan + gap register |
| `docs/specs/thinking-loop-v2.md` | Product spec |
| `docs/agent-shared-context.md` | Living decisions + code reality |
| `docs/agent-change-log.md` | Change history |
| `docs/DEPLOYMENT.md` | Railway + Supabase + MCP |
| `docs/SKILL-INDEX.md` | Agent skill catalog |
