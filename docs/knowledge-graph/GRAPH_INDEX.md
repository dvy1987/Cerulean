# Project Knowledge Graph Index

Generated: 2026-07-06T05:16:15.388696+00:00
Mode: **skill-library** | Nodes: 298 | Edges: 344

**Why this mode:** skill-library label: docs/skill-graph.md + docs/SKILL-INDEX.md present → adds authoritative skill invoke edges. Still scans full repo (not skills-only).

**Scan layers:**
- skills (112 in .agents/skills)
- repo-wide source ((root), packages, src, tests)
- docs (AGENTS.md, README.md, docs/**/*.md)
- memory (docs/memory, handoffs)
- packages (package.json workspaces)
- config (.agents/ROUTING.md, tsconfig, pyproject, etc.)
- top-level directories
- authoritative invokes (skill-graph.md + SKILL-INDEX.md)

EXTRACTED: 339 | INFERRED: 5

## Hub nodes
- types.ts (module)
- secure-skill
- universal-skill-creator
- actions.ts (module)
- venture-exploration
- registry.ts (module)
- experimentation
- validate-skills

## Communities

**cerulean** (3): cerulean-deployment, cerulean-mcp, cerulean-project
**code** (3): code-review-crsp, code-simplification, technical-debt-audit
**context** (1): context-engineering
**debug** (1): debug-and-fix
**performance** (12): app-security-hardening, browser-testing-with-devtools, ci-cd-and-automation, design-direction, design-review, design-system, frontend-design, gsap-animation, motion-animation, performance-optimization
  … +2 more
**test** (92): adversarial-hat, agent-builder, agent-launcher, agent-loom-sync, agent-system-architecture, api-and-interface-design, api-deprecation-and-migration, apply-paper-to-project, architectural-decision-log, assumption-mapping
  … +82 more

## Node types

- **config**: 5
- **directory**: 7
- **doc**: 31
- **handoff**: 1
- **memory**: 9
- **module**: 131
- **package**: 2
- **skill**: 112

See `GRAPH_REPORT.md` for surprising connections and suggested questions.

Full graph: `docs/knowledge-graph/graph.json`
Authoritative call edges: `docs/knowledge-graph/call-graph.json`
