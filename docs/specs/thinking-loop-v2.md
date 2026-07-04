# Thinking Loop v2 — Product Spec & Implementation Plan

**Status:** Approved — see [`implementation-master-plan.md`](./implementation-master-plan.md) for execution  
**Author:** Product + engineering (agent session)  
**Date:** 2026-07-04  
**Scope:** Three initiatives that together upgrade Cerulean from “chat with side panels” to a **thinking OS**

| # | Initiative | One-line outcome |
|---|------------|------------------|
| A | Proactive insight capture | AI proposes 0–3 insights after each reply; user confirms in one click |
| B | Template-first documents | Workspaces start with artifact scaffolding; promotion shows placement |
| C | Runtime agent consolidation | Four runtime concerns on the hot path; advanced features hidden |

**Program thesis:** PMs don’t fail at *thinking* — they fail at *losing ideas between chat and document*. These three changes attack that loss at capture, composition, and engineering complexity.

## Locked decisions (PM approved)

| Topic | Decision |
|-------|----------|
| Proposal latency | **OK to wait 1–3s** after reply before showing chips; do not block chat input |
| Default document type | **`product_spec`** (Product Spec) — not blank, not legacy PRD label |
| Template change | **v1 required** — user can switch template anytime with confirm + content preserved |
| Auto-save insights | **Never** — propose only; one-click save |

---

## 0. Prerequisites (do first or in parallel)

Initiatives A and B assume **one AI spine** (separate track, not repeated here):

- Web `ChatPanel` calls orchestrator (`chat.respond`), not `dev-ai` directly.
- Background pipeline runs after each completed assistant message.
- Dev mode remains fallback when no provider is configured.

Without the spine, proactive capture runs on template text and investors still see a toy. **Week 0** of the plan below includes spine work if not already done.

---

## Success metrics (program-level)

| Metric | Baseline (today) | Target (30 days post-ship) |
|--------|------------------|----------------------------|
| Insights saved per session | ~0–1 (manual highlight only) | ≥3 when user chats ≥5 turns |
| Time chat → first saved insight | User must discover highlight | <30s (first chip appears) |
| Promotion → accept rate | Unknown; empty doc placement feels random | ≥60% patches accepted |
| New user completes hero loop unaided | Low (no template, no guidance) | ≥70% in usability test |
| Agent code paths on web hot path | 2 (dev-ai + partial orchestrator) | 1 (orchestrator only) |

---

# Initiative A — Proactive Insight Capture

## Problem

Capture is **100% manual**: highlight → “Save insight.” That is identical to ChatGPT + a notes field. The PRD promise — *ideas never lost without breaking flow* — is unmet.

## Product principles

1. **AI proposes; user disposes.** Never auto-write to the insight tray.
2. **Non-blocking.** Chips appear after the reply finishes; they never interrupt streaming.
3. **Dismissible memory.** Dismissed proposals don’t reappear for the same message unless the user asks.
4. **Traceable.** Every saved insight links to `source_message_ids` (assistant turn that surfaced it).

## User stories

| As a… | I want… | So that… |
|-------|---------|----------|
| PM exploring a PRD topic | Cerulean to surface “this might be worth saving” after AI replies | I don’t lose nuance while staying in conversation |
| PM | To save a proposal with one click | Capture stays faster than copy-paste |
| PM | To dismiss bad proposals quietly | AI assistance doesn’t feel noisy |
| PM | Saved insights to show which chat turn they came from | I can re-read context later |

## UX spec

### Placement

```
┌─────────────────────────────────────┐
│ Chat messages                       │
│ ...                                 │
│ [Assistant message just completed]  │
├─────────────────────────────────────┤
│ 💡 Save as insight?                 │  ← NEW: ProposedInsightBar
│  [chip] [chip] [chip]    Dismiss all │
├─────────────────────────────────────┤
│ Continue Thinking (existing)        │
├─────────────────────────────────────┤
│ Chat input                          │
└─────────────────────────────────────┘
```

- **ProposedInsightBar** sits between message list and `ThinkingSuggestions`.
- Max **3 chips** visible. Overflow: “+1 more” expands inline.
- Chip label: insight **title** (≤60 chars). Full content in tooltip / expand on hover (desktop).
- Actions per chip: **Save** (primary), **Dismiss** (×).
- **Dismiss all** clears the bar for this message batch.
- Empty state: bar hidden (0 proposals).

### Interaction flows

**Happy path**
1. User sends message → assistant streams → stream completes.
2. Background pipeline runs (~1–3s). Chips fade in.
3. User clicks **Save** on chip → insight created with `status: captured`, toast “Insight saved”, chip removed.
4. Tray count increments; optional subtle tray pulse (once per session).

**Dismiss**
- Per-chip dismiss: remove chip; record dismissal so it isn’t re-fetched.
- Dismiss all: clear bar; record all proposal IDs as dismissed for this `assistant_message_id`.

**Settings** (Advanced → AI)
- Toggle: **“Suggest insights after replies”** (default **on**).
- When off: no background extraction; manual highlight unchanged.

### Copy

| Element | Text |
|---------|------|
| Section label | `Ideas worth saving?` |
| Save button (chip) | `Save` |
| Dismiss all | `Not now` |
| Toast on save | `Insight saved` |
| Empty / loading | No skeleton; bar simply absent until proposals arrive |

Tone: calm, optional — not “AI found 3 insights!!!”

## Logic spec

### When extraction runs

Trigger: **`chat.respond` completes successfully** (assistant message finalized in store/DB).

Not on: user messages, failed streams, or duplicate finalize events.

### What extraction receives

```typescript
{
  userMessage: string;           // the turn's user message
  assistantMessage: string;    // full assistant reply
  assistantMessageId: string;
  conversationId: string;
  recentContext: Message[];    // last 4 messages before this turn (optional)
  existingInsightTitles: string[];  // dedupe
}
```

### Output schema (structured)

```typescript
interface ProposedInsight {
  proposal_id: string;         // client-generated uuid; stable for dismiss
  title: string;               // ≤60 chars
  content: string;             // 1–3 sentences, self-contained
  confidence: "high" | "medium";  // UI may de-emphasize medium
  source_message_ids: string[];   // [assistantMessageId]
}

interface InsightProposeResult {
  proposals: ProposedInsight[];  // 0–3 items
}
```

### Extraction rules (prompt-level)

Extract only if the assistant message contains:
- A **decision**, **constraint**, **user insight**, **risk**, **open question**, or **distinct claim** worth revisiting later.

Do **not** extract:
- Generic AI filler (“great question”, “let me break this down”)
- Content already captured in an existing insight (title similarity > ~0.8)
- Restatements of the user’s message with no new substance

Return **0 proposals** when nothing merits capture — empty is success, not failure.

### Architecture (no new agent)

Extend **`insight_extraction`** with a second mode OR add action `insight.propose` routed to the same agent file:

| Action | Input | Output |
|--------|-------|--------|
| `insight.extract` (existing) | Long imported text | 3–8 insights |
| `insight.propose` (new) | Last chat turn | 0–3 proposals |

**Background pipeline** after `chat.respond` (in `dev-router` / post-chat hook):

```
chat.respond (primary, blocking, streamed)
  → background (non-blocking):
      1. insight.propose     (if settings.suggestInsights)
      2. suggestion.generate (existing; powers Continue Thinking)
      3. ranking.score       (if enabled)
      4. graph.update        (if enabled)
```

Fold **`suggestion`** and **`insight.propose`** into one background batch keyed by `assistant_message_id`. UI subscribes to results via client store or SSE/poll endpoint.

**Do not** merge proposal content into `ThinkingSuggestions` — different jobs (save vs continue chatting).

### Data model

**Phase 1 (no migration):** proposals live in **client state only** (`proposedInsights: ProposedInsight[]` in Zustand). Dismissals stored in `sessionStorage` keyed by `proposal_id`.

**Phase 2 (persistence):** optional table `insight_proposals` for cross-device dismiss — defer unless needed.

Saved insights use existing `insights` table; ensure `source_message_ids` includes assistant message id.

### API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/ai/run` | Existing; add action `insight.propose` |
| GET | `/api/v1/ai/proposals?messageId=` | Optional poll after chat (if not pushing via websocket) |

**Preferred for web:** extend chat completion response to include `backgroundJobId`; client polls `/api/v1/ai/background/{id}` once — or push proposals through existing workspace sync hook.

**Simpler MVP (approved):** `ChatPanel` fires `workspaceApi.runAiAction({ type: "insight.propose", ... })` in `finally` after stream; **awaits** proposals before showing chips (1–3s latency — user approved).

### Acceptance criteria

- [ ] After assistant reply, 0–3 chips appear within 5s (with provider) or instantly (dev fallback).
- [ ] Save creates insight in tray with correct `source_message_ids`.
- [ ] Dismiss removes chip and does not re-show on page refresh (session).
- [ ] Toggle off in settings disables proposals; manual highlight still works.
- [ ] No proposals when assistant message is <80 chars (noise gate).
- [ ] Duplicate titles vs existing tray insights suppressed.

### Dev-mode fallback

When provider is `dev`, `insight.propose` uses heuristics on assistant text (bullet lines, bold segments, sentences with “should”, “risk”, “assumption”) — max 2 proposals. Keeps UX testable without API keys.

---

# Initiative B — Template-First Documents

## Problem

New workspaces start with **Untitled Document** and **zero blocks**. Promotion appends to the end or invents “Key Ideas” — arbitrary for PM artifacts. Users think in **product specs / memos / analysis**, not blank canvases.

## Product principles

1. **Artifact type at birth** — default **Product Spec**; changeable anytime via document menu.
2. **Scaffolding is editable** — templates seed structure, not locked content.
3. **Promotion is placement-aware** — user sees *where* content lands before accepting patch.
4. **Export matches template** — export uses section semantics for the active document type.
5. **Template changes preserve work** — merge-by-default; destructive reset requires explicit opt-in.

## User stories

| As a… | I want… | So that… |
|-------|---------|----------|
| PM starting a product spec | A pre-structured document | I promote ideas into the right section |
| PM | To see “Adding under Requirements” before accepting a patch | I trust AI placement |
| PM | Product Spec as the default when I open Cerulean | I don’t configure before thinking |
| PM | To switch from Product Spec → Strategy Memo mid-project | The doc structure matches my deliverable without starting over |
| PM | Empty sections to stay visible as headings | I see what’s still missing |

## Document types (v1)

| Type ID | UI label | Title default | Default? |
|---------|----------|---------------|----------|
| `product_spec` | Product Spec | Product Spec | **Yes** |
| `strategy_memo` | Strategy Memo | Strategy Memo | |
| `product_analysis` | Product Analysis | Product Analysis | |
| `blank` | Blank document | Untitled Document | |

### Block scaffolding

**Product Spec (`product_spec`)** — headings only at init:

| Order | Heading |
|-------|---------|
| 1 | Overview |
| 2 | Problem |
| 3 | Users |
| 4 | Requirements |
| 5 | Solution |
| 6 | Success Metrics |
| 7 | Non-Goals |
| 8 | Open Questions |

**Strategy memo (`strategy_memo`)**  
Context → Thesis → Evidence → Implications → Risks → Next Steps

**Product analysis (`product_analysis`)**  
Question → Findings → Options → Recommendation → Open Questions

> **Storage rule:** Heading blocks only at init; paragraphs created on first promotion into section.

## UX spec

### Workspace creation

**When:** First load (no workspace) or explicit “New workspace” (future).

**Modal / inline picker** (max 3 cards + “Blank document”):

```
What are you writing?
[ Product Spec ✓ ]  [ Strategy Memo ]  [ Product Analysis ]  [ Blank ]
```

- Default selection: **Product Spec** (pre-selected).
- Sets `document.title` + seeds headings + stores `document_type`.

### Template change (v1)

**Entry:** Document `⋯` menu → **Change template…**

- **Empty doc:** apply immediately.
- **Has content:** confirm modal — preserve written blocks, add missing headings, orphans → **Carryover** section.
- Preview via `POST /api/v1/document/preview-template-change`.

Full algorithm: `implementation-master-plan.md` → WS-3.6.

### Promotion placement preview

Before patch review, show **placement line** on `PatchReview` card:

```
Adding under: Requirements
─────────────────────
AI Patch Pending
Insert paragraph after "Requirements" heading
[Accept] [Reject]
```

**Data:** extend `Patch` or patch metadata:

```typescript
interface Patch {
  // existing fields...
  placement_label?: string;      // "Solution"
  placement_block_id?: string; // target section heading block_id
}
```

Generated by Document Integration Agent (or `generatePromotionPatch` v2) using template section map.

### Section-aware placement logic

1. Classify promoted text against section headings (embedding or LLM JSON: `{ target_section: "Solution", adapted_text: "..." }`).
2. Find heading block with matching `content` (case-insensitive).
3. Insert new paragraph block at `position` after last child of that section (before next heading).
4. If confidence low → insert under **Open Questions** + `placement_label` notes low confidence (UI subtle warning).

### Document panel affordances

- Section headings get subtle left border when **empty** (no paragraph child with content).
- “Missing sections” hint in document header when >2 empty sections: `3 sections still open`

## Data model

### Schema migration `003_document_templates.sql`

```sql
ALTER TABLE public.documents
  ADD COLUMN document_type TEXT NOT NULL DEFAULT 'product_spec'
    CHECK (document_type IN ('blank', 'product_spec', 'strategy_memo', 'product_analysis'));

ALTER TABLE public.documents
  ADD COLUMN template_version SMALLINT NOT NULL DEFAULT 1;
```

### TypeScript

```typescript
export type DocumentType =
  | "blank"
  | "product_spec"
  | "strategy_memo"
  | "product_analysis";

export interface Document {
  document_id: string;
  title: string;
  document_type: DocumentType;
  template_version: number;
  created_at: string;
  updated_at: string;
}
```

### Template registry

New file: `src/lib/document-templates/index.ts`

- `getTemplate(type): TemplateDefinition`
- `seedBlocks(documentId, type): DocumentBlock[]`
- Called from `documentStore` init and `WorkspaceService` user bootstrap (`001` trigger / signup).

**Existing users:** migration sets `document_type = 'product_spec'` for empty docs; banner “Apply Product Spec structure?” optional.

## Agent changes

**Document Integration Agent** prompt update:

- Input adds `document_type` + ordered headings from context.
- Output: `{ target_section, adapted_text }` then deterministic patch builder places block.
- Remove “Key Ideas” default for templated docs.

## API changes

| Endpoint | Change |
|----------|--------|
| `POST /api/v1/workspace` or signup bootstrap | Default `documentType: product_spec`, seed blocks |
| `PATCH /api/v1/document` | `documentType` change → merge via `change-template.ts` |
| `POST /api/v1/document/preview-template-change` | Preview merge summary |
| `POST /api/v1/patches` | Response includes `placement_label` |

## Acceptance criteria

- [ ] New user gets **Product Spec** by default with section headings.
- [ ] User can **change template** with confirm; written content preserved (Carryover if needed).
- [ ] Promoting feature text places under **Solution** or **Requirements** (≥70% golden set).
- [ ] Patch review shows placement label.
- [ ] `exportByTemplate('product_spec')` outputs structured markdown.
- [ ] Blank type preserves freeform behavior.
- [ ] In-memory mode same picker; default Product Spec.

---

# Initiative C — Runtime Agent Consolidation + Advanced Mode

## Problem

Eleven agents create eleven prompts, test paths, and failure modes — but users experience **four jobs**: talk, capture/compose, triage knowledge, (later) learn. Engineering velocity and demo clarity suffer. Power features (graph, exemplars, MCP) distract from the hero loop.

## Product principles

1. **User actions map to runtime routes, not agent files.** Internal files can stay; external contract simplifies.
2. **Fail soft on background work.** Chat never breaks because ranking failed.
3. **Progressive disclosure.** Default UI = Chat | Document | Insights.
4. **Docs can keep 11-agent vocabulary** for future; runtime groups are implementation detail.

## Runtime map

| Runtime group | Agent IDs absorbed | User-triggered actions |
|---------------|-------------------|------------------------|
| **Conversation** | `chat`, `insight.to_prompt`, `suggestion`, `insight.propose` | Send message, click thinking chip, insight → chat |
| **Document** | `document_integration`, `document_expansion`, `tonal_adjustment` | Promote, expand block, tone adjust |
| **Graph** | `knowledge_graph`, `ranking`, `insight.detect_contradictions` | Background only; tray order, badges |
| **Meta** (deferred) | `exemplar_learning`, `memory_management` | Settings → Advanced only |

## Orchestrator contract (new surface)

Replace scattered `AiAction` types with **four primary routes** + background envelope:

```typescript
type RuntimeRoute =
  | "conversation.respond"
  | "conversation.propose_insights"
  | "document.integrate"
  | "document.expand"
  | "graph.refresh";

interface RuntimeRequest {
  route: RuntimeRoute;
  input: Record<string, unknown>;
  background?: boolean;
}
```

**Internal adapter layer** (`src/lib/ai/runtime-router.ts`) maps route → existing agent(s). Agent files unchanged in v1; registry stays.

Example:

```typescript
"conversation.respond" → chat agent (+ schedule graph.refresh background)
"document.integrate"   → document_integration (+ tonal if setting on)
```

## Advanced mode UX

### Default workspace chrome

```
[ Chat | Document ]     Insights ▾
```

- **Remove** Graph tab from default header.
- **Remove** Exemplar button from default header.
- Settings icon remains.

### Advanced mode toggle

Location: **Settings → General → Advanced mode**

When enabled:
- Graph tab appears
- Exemplar upload appears
- Settings shows full “Background agents” matrix
- Footer link: “MCP & API docs”

Persist in `workspace_settings` JSON (existing settings table) + localStorage for non-persisted mode.

### Settings simplification (default)

| Setting | Default | Advanced only |
|---------|---------|---------------|
| Suggest insights after replies | on | — |
| Continue thinking suggestions | on | — |
| Knowledge graph updates | on | visible |
| Insight ranking | on | visible |
| Tonal adjustment on promote | on | visible |
| Exemplar learning | off | visible |

## Background pipeline standardization

Single module: `src/lib/ai/post-chat-pipeline.ts`

```typescript
async function runPostChatPipeline(ctx, assistantMessageId, settings) {
  const tasks = [];
  if (settings.suggestInsights) tasks.push(insight.propose);
  if (settings.backgroundAgents.suggestion) tasks.push(suggestion.generate);
  if (settings.backgroundAgents.ranking) tasks.push(ranking.score);
  if (settings.backgroundAgents.knowledgeGraph) tasks.push(graph.update);
  await Promise.allSettled(tasks.map(t => runAiAction(t)));
}
```

Called from orchestrator after `chat.respond` completes — **one place**, not `ChatPanel` ad hoc.

## MCP / API

- `/api/v1/ai/run` accepts both legacy `AiAction` and `RuntimeRequest` for 90 days.
- MCP tools unchanged; internally map to runtime routes.

## Acceptance criteria

- [ ] Web hot path uses orchestrator only (no `dev-ai` imports in `src/modules/**`).
- [ ] Post-chat pipeline runs propose + suggestion in one batch.
- [ ] Fresh install: no Graph tab until Advanced enabled.
- [ ] Toggling Advanced persists across refresh (Supabase on) or session (local).
- [ ] Agent registry still has 11 entries; runtime router tests cover 4 routes.

---

# Implementation Plan

> **Full gap register, file manifest, and sprint tasks:** [`implementation-master-plan.md`](./implementation-master-plan.md)

## Phase overview

```
Phase 0 (Week 1)  ─ Spine + runtime router skeleton
Phase 1 (Week 2)  ─ Initiative C (consolidation + advanced mode)
Phase 2 (Week 3)  ─ Initiative A (proactive capture)
Phase 3 (Week 4)  ─ Initiative B (templates + placement)
Phase 4 (Week 5)  ─ Polish, golden tests, demo workspace
```

Initiatives A and B depend on Phase 0–1. B can overlap A in week 4 if two tracks.

---

## Phase 0 — AI spine (blocking)

**Goal:** Web uses orchestrator; background hook exists.

| Task | Files | Est. |
|------|-------|------|
| Streaming chat via orchestrator | `ChatPanel.tsx`, `chat-agent.ts`, new `/api/v1/ai/chat/stream` or extend existing | 2d |
| Remove direct `dev-ai` from ChatPanel | `ChatPanel.tsx` | 0.5d |
| `post-chat-pipeline.ts` stub | new, `orchestrator.ts` | 1d |
| `runtime-router.ts` adapter (pass-through to existing agents) | new | 1d |
| Smoke test: send message → real or dev response | `tests/` | 0.5d |

**Exit:** Chat works in dev + provider mode through orchestrator.

---

## Phase 1 — Runtime consolidation + Advanced mode (Initiative C)

| Task | Files | Est. |
|------|-------|------|
| `RuntimeRequest` types + adapter | `actions.ts`, `runtime-router.ts` | 1d |
| Wire `DocumentBlockView` expand through runtime route | `DocumentBlockView.tsx` | 0.5d |
| Wire promote through `document.integrate` | `ChatPanel`, `InsightTray`, `workspace-service` | 1d |
| `post-chat-pipeline` implements batch background | `post-chat-pipeline.ts`, `background.ts` | 1d |
| Advanced mode setting + persistence | `SettingsPanel.tsx`, settings API, migration if needed | 1d |
| Hide Graph / Exemplar in `Workspace.tsx` when advanced off | `Workspace.tsx` | 0.5d |
| Simplified settings UI (default) | `SettingsPanel.tsx` | 1d |

**Exit:** Default UI is 3-surface; orchestrator owns hot path.

---

## Phase 2 — Proactive insight capture (Initiative A)

| Task | Files | Est. |
|------|-------|------|
| Add `insight.propose` action + result types | `actions.ts` | 0.5d |
| Extend `insight-extraction-agent` with propose mode + prompt | `insight-extraction-agent.ts` | 1d |
| Dev fallback heuristics | `dev-ai.ts` or agent file | 0.5d |
| Route in `dev-router` + post-chat pipeline | `dev-router.ts`, `post-chat-pipeline.ts` | 0.5d |
| `proposedInsightStore` (Zustand) | new `src/store/proposedInsightStore.ts` | 0.5d |
| `ProposedInsightBar` component | new `src/modules/chat/ProposedInsightBar.tsx` | 1d |
| Integrate in `ChatPanel` after stream complete | `ChatPanel.tsx` | 0.5d |
| Save → existing `addInsight` / `workspaceApi.addInsight` | wired | 0.5d |
| Dismiss + sessionStorage | store | 0.5d |
| Settings toggle `suggestInsights` | settings types, panel, DB JSON | 0.5d |
| Dedupe vs existing insights | agent or client | 0.5d |

**Exit:** All acceptance criteria for Initiative A.

---

## Phase 3 — Template-first documents (Initiative B)

| Task | Files | Est. |
|------|-------|------|
| Migration `003_document_templates.sql` | `supabase/migrations/` | 0.5d |
| `document-templates` registry | `src/lib/document-templates/` | 1d |
| `DocumentType` on `Document` type + mappers | `types/index.ts`, `workspace-service.ts` | 0.5d |
| Template picker on first workspace load | new `DocumentTypePicker.tsx`, `Workspace.tsx` | 1.5d |
| **Change template modal + merge** | `change-template.ts`, `ChangeTemplateModal.tsx`, preview API | 2d |
| Seed blocks on signup / local init | `workspace-service`, `documentStore` | 1d |
| Section-aware `generatePromotionPatch` v2 | `dev-ai.ts` → move to `src/lib/document/placement.ts` | 1.5d |
| Document agent: return `target_section` | `document-integration-agent.ts` | 1d |
| `placement_label` on Patch type + API | `types`, patches routes, `PatchReview.tsx` | 1d |
| Empty section styling in `DocumentPanel` | `DocumentPanel.tsx`, `DocumentBlockView.tsx` | 0.5d |
| Update `exportByTemplate` for product_spec | `documentStore.ts` | 0.5d |

**Exit:** All acceptance criteria for Initiative B.

---

## Phase 4 — Polish & demo readiness

| Task | Est. |
|------|------|
| Golden tests: 10 promotion prompts → correct section | 1d |
| Golden tests: 10 chat turns → sensible proposal count | 1d |
| Pre-loaded demo workspace (Product Spec type, sample insights) | 1d |
| Update `HANDOFF.md`, `agent-shared-context.md` | 0.5d |
| Investor 60s script in empty state copy | 0.5d |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Proposal noise annoys users | Strict 0–3 cap; easy dismiss; default quality bar in prompt; off toggle |
| Template picker friction on every visit | Show once per workspace; remember choice |
| Section misplacement erodes trust | Show placement before accept; fallback to Open Questions |
| Runtime refactor breaks MCP | Adapter keeps legacy `AiAction`; integration tests on `/api/v1/ai/run` |
| Latency after chat (propose + suggest) | Run in parallel; show chips when ready; don’t block input |
| Schema migration on self-hosted Supabase | Document in `DEPLOYMENT.md`; migration idempotent |

---

## Resolved decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Proposal latency | **Await 1–3s** (PM approved) |
| 2 | Heading-only seeds | **Yes** |
| 3 | Template change after content | **v1** — merge + Carryover + confirm |
| 4 | Merge proposals with ThinkingSuggestions? | **No** |
| 5 | Combined LLM call for propose+suggest? | **No** — parallel |
| 6 | Default document type | **`product_spec`** |

---

## File touch list (summary)

**New**
- `src/lib/ai/runtime-router.ts`
- `src/lib/ai/post-chat-pipeline.ts`
- `src/lib/document-templates/index.ts`
- `src/lib/document/placement.ts`
- `src/store/proposedInsightStore.ts`
- `src/modules/chat/ProposedInsightBar.tsx`
- `src/components/DocumentTypePicker.tsx`
- `supabase/migrations/003_document_templates.sql`
- `src/lib/document-templates/change-template.ts`
- `src/components/ChangeTemplateModal.tsx`
- `docs/specs/implementation-master-plan.md`

**Major edits**
- `ChatPanel.tsx`, `Workspace.tsx`, `SettingsPanel.tsx`
- `insight-extraction-agent.ts`, `document-integration-agent.ts`
- `orchestrator.ts`, `dev-router.ts`, `actions.ts`
- `workspace-service.ts`, `documentStore.ts`, `PatchReview.tsx`
- `types/index.ts`

---

## Definition of done (program)

The program ships when a new user can:

1. Land on **Product Spec** template by default (or confirm picker with Product Spec pre-selected).
2. Chat with real AI (or credible dev fallback).
3. See **1–3 insight chips** after replies and save one in one click.
4. Promote text and see **“Adding under {section}”** (e.g. Requirements, Solution).
5. Accept patch into structured Product Spec.
6. **Change template** to Strategy Memo without losing content.
7. Export markdown that looks like a deliverable.
8. Never see Graph or Exemplar unless Advanced mode is on.

That is Cerulean’s differentiation in one flow.
