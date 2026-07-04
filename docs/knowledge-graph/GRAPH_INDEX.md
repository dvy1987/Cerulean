# Project Knowledge Graph Index

Generated: 2026-07-04T09:08:47.225598+00:00
Mode: **skill-library** | Nodes: 256 | Edges: 369

**Why this mode:** skill-library label: docs/skill-graph.md + docs/SKILL-INDEX.md present → adds authoritative skill invoke edges. Still scans full repo (not skills-only).

**Scan layers:**
- skills (105 in .agents/skills)
- repo-wide source ((root), packages, src, tests)
- docs (AGENTS.md, README.md, docs/**/*.md)
- memory (docs/memory, handoffs)
- packages (package.json workspaces)
- config (.agents/ROUTING.md, tsconfig, pyproject, etc.)
- top-level directories
- authoritative invokes (skill-graph.md + SKILL-INDEX.md)

EXTRACTED: 297 | INFERRED: 72

## Hub nodes
- universal-skill-creator
- types.ts (module)
- secure-skill
- venture-exploration
- registry.ts (module)
- actions.ts (module)
- index.ts (module)
- experimentation

## Communities

**cerulean** (3): cerulean-deployment, cerulean-mcp, cerulean-project
**code** (3): code-review-crsp, code-simplification, technical-debt-audit
**context** (1): context-engineering
**debug** (1): debug-and-fix
**design** (9): app-security-hardening, browser-testing-with-devtools, ci-cd-and-automation, design-direction, design-review, design-system, frontend-design, performance-optimization, shipping-and-launch
**pre** (88): adversarial-hat, agent-builder, agent-launcher, agent-system-architecture, api-and-interface-design, api-deprecation-and-migration, apply-paper-to-project, architectural-decision-log, assumption-mapping, brainstorming
  … +78 more

## Node types

- **config**: 5
- **directory**: 6
- **doc**: 29
- **handoff**: 1
- **memory**: 9
- **module**: 99
- **package**: 2
- **skill**: 105

See `GRAPH_REPORT.md` for surprising connections and suggested questions.

Full graph: `docs/knowledge-graph/graph.json`
Authoritative call edges: `docs/knowledge-graph/call-graph.json`
