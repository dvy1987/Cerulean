---
artifact: feature-spec
status: Approved
constitution: AGENTS.md@current (no docs/constitution.md yet)
title: Smart Placement & LLM Orchestrator Routing
slug: smart-routing-and-placement
approved: 2026-07-06
pm-decisions: CL-1 default on (revised 2026-07-06); CL-2 98% placement; CL-3 full intelligence for CLI/MCP
sources:
  - docs/PRD.md
  - docs/specs/thinking-loop-v2.md
  - docs/agent-shared-context.md
  - docs/HANDOFF.md
parent: thinking-loop-v2
---

# Feature Spec: Smart Placement & LLM Orchestrator Routing

## Summary

Cerulean should place promoted text in the **correct document section 98% of the time**, and route AI work through an **intelligent orchestrator by default** — with identical behavior on **web, API, and CLI/MCP**. Users can turn smart features off in Settings if they want to reduce LLM usage and cost.

This closes the two largest remaining quality gaps after Thinking Loop v2: **unreliable section placement** and **deferred LLM routing** (originally approved 2026-03-21, postponed for MVP).

## Problem

### Placement

When a user promotes chat text or an insight into a Product Spec, they see “Adding under: {section}” before accepting. Today:

- With a real AI provider, placement depends on a single JSON call that sometimes returns nothing useful.
- Without a provider (dev mode), placement falls back to **keyword guessing**, which passes only **~70%** of automated placement cases.
- Users cannot tell when the system is **uncertain** — misplaced content erodes trust in the whole loop.

**Stakeholder:** PM exploring a PRD in chat who promotes a requirement and finds it under “Open Questions” or the wrong heading.

### Orchestrator routing

Cerulean’s architecture calls for an orchestrator that **decides which specialist handles each request** (hub-and-spoke). Today every request type maps to a **fixed agent** via rules. That was a deliberate MVP shortcut.

**Consequences:**

- New actions or combined intents require code changes, not prompt tuning.
- Runtime groups (`conversation`, `document`, `graph`) exist on paper but routing does not use them intelligently.
- Product direction (LLM routing) and shipped behavior are **out of sync**.
- **CLI/MCP** (Cursor, Antigravity) uses the same orchestrator as the web app today, but without intelligent routing — a second-class experience for cost-conscious power users who may prefer CLI as their primary interface.

## User Scenarios

### US-1 — Confident promotion

**As a PM**, I highlight a sentence about pricing and promote it to the document.

**I want** the patch preview to say “Adding under: Requirements” (or the best-fit section) **and** I want that to be right most of the time.

**So that** I trust Accept without re-editing structure.

### US-2 — Honest uncertainty

**As a PM**, I promote vague or multi-topic text.

**I want** the UI to show that placement is low-confidence (e.g. under Open Questions with a subtle warning).

**So that** I know to review before accepting.

### US-3 — Intelligent routing (default on)

**As a user**, I send chat, promote text, expand a block, or use MCP/CLI.

**I want** the system to use intelligent orchestrator routing **out of the box**.

**So that** I get the best experience without configuring anything first.

### US-4 — Cost control (opt-out)

**As a cost-sensitive user** (subscriptions, bring-your-own keys),

**I want** to **turn off** smart routing and smart placement in Settings when I choose.

**So that** I can reduce LLM calls — but the default should still be the full intelligent product.

### US-5 — CLI/MCP parity

**As a user working from Cursor via MCP**,

**I want** MCP/CLI tools to use the same smart routing and placement as the web app **by default**.

**So that** CLI is not a degraded path — it may be my main way of working.

### US-6 — Graceful offline / dev mode

**As a developer or demo user** without API keys,

**I want** the same flows to work with credible fallbacks.

**So that** local development and investor demos do not break.

## Functional Requirements

### Placement intelligence

- **FR-1** The system SHALL classify promoted text into **one** target section from the active document template (Product Spec, Strategy Memo, Product Analysis, or Blank behavior unchanged).
- **FR-2** Each placement decision SHALL include a **confidence level**: `high`, `medium`, or `low`.
- **FR-3** When confidence is `low`, the system SHALL default placement to the template’s **fallback section** (e.g. Open Questions for Product Spec) and SHALL surface low-confidence in the patch preview.
- **FR-4** Placement SHALL use **AI classification first** when smart placement is **enabled** (default **on**) and a provider is available; SHALL use **deterministic fallback** when smart placement is off, AI is unavailable, times out, or returns invalid output.
- **FR-5** Placement SHALL consider: promoted text, document type, ordered section headings, and **existing block content** (not headings alone).
- **FR-6** The patch preview SHALL continue to show `Adding under: {section}` before accept/reject.

### Orchestrator routing

- **FR-7** The orchestrator SHALL support **LLM-based routing** for incoming work units — **enabled by default** when a provider is available.
- **FR-8** LLM routing SHALL respect user settings (background agents on/off, advanced mode) and SHALL never route to disabled background work.
- **FR-9** When LLM routing fails or confidence is below threshold, the system SHALL **fall back** to today’s rule-based routing without user-visible errors.
- **FR-10** Routing decisions SHALL be **logged** (agent id, route/action type, source: llm|rules, latency ms) for debugging — no PII in logs.
- **FR-11** When smart routing is **enabled** (default), the **same routing path** SHALL apply to **all entry points**: web chat stream, post-chat pipeline actions, promote/expand APIs, `/api/v1/ai/run`, and **MCP/CLI**. When **disabled by user**, all entry points use rule-based routing.
- **FR-15** Smart routing and smart placement SHALL default to **on** for new users. Existing users on upgrade SHALL be migrated to **on** unless they previously opted out.
- **FR-16** Settings SHALL expose toggles to **disable** smart routing and smart placement, with plain-language copy explaining that turning them off reduces LLM usage (and may reduce quality).
- **FR-17** MCP server tools SHALL invoke the same orchestrator routing logic as the web app — no parallel or simplified routing in `packages/cerulean-mcp`.

### Evaluation & quality gates

- **FR-12** A **golden placement suite** SHALL exist with at least **50** labeled promote prompts across all three structured templates (enough granularity for 98% thresholds).
- **FR-13** Automated tests SHALL enforce **≥98%** section accuracy on the golden suite using the **fallback classifier** (dev/no-provider path) — **49/50 or better**.
- **FR-14** When smart placement is enabled in eval (`CERULEAN_EVAL_LLM=true`), automated tests SHALL enforce **≥98%** end-to-end placement accuracy with a configured test provider.

## Non-Functional Requirements

- **NFR-1 Latency — placement:** Additional placement logic adds **≤500ms p95** on promote (excluding user network) when provider is warm.
- **NFR-2 Latency — router:** When smart routing is **off** (user disabled), zero added latency. When **on** (default), LLM routing adds **≤400ms p95** per action.
- **NFR-3 Cost:** Users can disable smart features to save calls. When on, router uses a **small/fast model**; placement uses structured JSON, max **1** LLM call per promote.
- **NFR-4 Reliability:** If LLM routing or placement fails, user flows complete successfully via fallback — **no failed promotes, no broken chat**.
- **NFR-5 Testability:** Golden tests run without API keys; provider-backed eval is opt-in via env flag.

## Acceptance Criteria

### AC-FR-1.1
**Given** a Product Spec with standard headings and a promote text clearly about user personas  
**When** the user creates a promotion patch  
**Then** `placement_label` is **Users** with confidence `high` or `medium`

### AC-FR-2.1
**Given** any successful placement  
**When** the patch is created  
**Then** the response includes `placement_confidence` ∈ {`high`, `medium`, `low`}

### AC-FR-3.1
**Given** placement confidence is `low`  
**When** the patch preview renders  
**Then** the user sees the fallback section name **and** a visible low-confidence hint (copy TBD in design pass)

### AC-FR-4.1
**Given** no AI provider is configured (`dev` mode)  
**When** the user promotes text  
**Then** placement completes using fallback only and patch preview still appears within **2s**

### AC-FR-4.2
**Given** a configured provider  
**When** the provider returns invalid JSON twice  
**Then** placement still succeeds via fallback with confidence `low` or `medium`

### AC-FR-7.1
**Given** smart routing is **on** (default) and provider is configured  
**When** `document.promote` is invoked from **web or MCP**  
**Then** primary agent is `document_integration` (or equivalent) with routing source `llm` or `rules` logged

### AC-FR-15.1
**Given** a new user signs up  
**When** they open Settings  
**Then** smart routing and smart placement are **on** by default

### AC-FR-15.2
**Given** no AI provider configured (dev mode)  
**When** any action runs  
**Then** smart features gracefully use rule/heuristic fallbacks with **no errors**

### AC-FR-16.1
**Given** smart routing on (default)  
**When** user sends chat via web **or** MCP triggers an AI action  
**Then** both paths use `llm-router` (with rules fallback on failure)

### AC-FR-9.1
**Given** LLM routing enabled and router LLM times out  
**When** any action is processed  
**Then** rule-based routing handles the action and the user receives a normal result

### AC-FR-12.1
**Given** the golden placement suite (≥50 cases)  
**When** `npm test` runs in CI  
**Then** fallback classifier accuracy ≥ **98%** (49/50 or better)

### AC-FR-13.1
**Given** `CERULEAN_EVAL_LLM=true`, smart placement enabled, and provider env in CI  
**When** eval job runs  
**Then** end-to-end placement accuracy ≥ **98%**

## Edge Cases

- **EC-1** Blank document type — no section headings: placement appends to end; confidence `high`; no low-confidence UI.
- **EC-2** Promoted text fits multiple sections equally — choose best match; if tie, prefer earlier section in template order; confidence `medium`.
- **EC-3** Target section heading missing (user deleted heading) — insert at nearest valid position; label shows intended section; confidence `low`.
- **EC-4** Very short promote text (&lt;20 chars) — skip AI call; use fallback; confidence `low`.
- **EC-5** Unknown agent returned by LLM router — ignore; use rule-based routing; log warning.
- **EC-6** User disables all background agents — router must not schedule disabled background work even if LLM suggests it.

- **EC-7** User disables smart routing but leaves smart placement on — routing uses rules; placement uses AI when provider available.
- **EC-8** User disables both — full dev-mode behavior; no LLM calls for routing or placement.

## Out of Scope

- Changing the 11-agent roster or merging agents further
- New document templates beyond existing four types
- Auto-accepting patches without user review
- Server-side product analytics dashboard (session metrics stay client-only)
- Multi-language placement
- Retrieval / embedding-based placement (future phase)
- **Changing MCP tool names or public tool contracts** — internal routing only; tool surface unchanged

## Constitution Waivers

None. Aligns with AGENTS.md: AI through `/src/lib/ai`, dual-mode persistence, no new core entities.

## Resolved Decisions (2026-07-06)

| ID | Decision | PM ruling |
|----|----------|-----------|
| **CL-1** | Smart routing & placement default | **On by default** (revised 2026-07-06). Users can turn off in Settings to reduce LLM usage. No provider = fallbacks only. |
| **CL-2** | Placement accuracy bar | **≥98%** on golden suite (49/50+). Expand suite to ≥50 cases. |
| **CL-3** | Chat / CLI path | **No exemptions.** Web chat stream **and** MCP/CLI get full intelligence when smart routing is on. CLI is first-class. |

## Review Checklist

- [x] No implementation detail in FRs (verified)
- [x] Every FR has AC coverage
- [x] Out of scope explicit
- [x] CLs resolved (2026-07-06)
- [x] PM approved CL rulings → **Approved**

## Success Metrics (post-ship)

| Metric | Baseline | Target (30 days) |
|--------|----------|-------------------|
| Golden placement accuracy (fallback) | ~70% | **≥98%** (49/50) |
| Promotion accept rate | Unknown | ≥65% (up from 60% program goal) |
| Promotes with low-confidence label | N/A | &lt;15% of promotes (tighter bar at 98% placement) |
| Router fallback rate when smart routing on | N/A | &lt;10% |
| Users who need to reduce LLM costs | Unknown | Can disable in Settings; copy explains tradeoff |
