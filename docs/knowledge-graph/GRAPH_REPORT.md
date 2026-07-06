# Knowledge Graph Report

Generated: 2026-07-06T05:16:15.388696+00:00
Mode: skill-library | Nodes: 298 | Edges: 344

**Why this mode:** skill-library label: docs/skill-graph.md + docs/SKILL-INDEX.md present → adds authoritative skill invoke edges. Still scans full repo (not skills-only).

## God nodes (skills + modules)
- types.ts (module)
- secure-skill
- universal-skill-creator
- actions.ts (module)
- venture-exploration
- registry.ts (module)
- experimentation
- validate-skills
- improve-skills
- memory

## Surprising cross-community connections
- project-orchestrator → skill-routing (invokes: project ↔ skill)
- project-orchestrator → process-decomposer (invokes: project ↔ process)
- motion-animation → svg-creation (invokes: motion ↔ svg)
- publish-skill → validate-skills (invokes: publish ↔ validate)
- publish-skill → improve-skills (invokes: publish ↔ improve)
- customer-discovery → venture-exploration (invokes: customer ↔ venture)
- harness-evolution → eval-pipeline (invokes: harness ↔ eval)
- reality-check → assumption-mapping (invokes: reality ↔ assumption)

## Suggested questions
- How does project-orchestrator (project) connect to skill-routing (skill)?
- How does project-orchestrator (project) connect to process-decomposer (process)?
- How does motion-animation (motion) connect to svg-creation (svg)?
- What depends on types.ts (module), and what does types.ts (module) invoke?
- What depends on secure-skill, and what does secure-skill invoke?
- What depends on universal-skill-creator, and what does universal-skill-creator invoke?

## Provenance
- Authoritative invokes: 186
- EXTRACTED: 339 | INFERRED: 5

Query: `python3 .agents/skills/knowledge-graph/scripts/query_graph.py path <A> <B>`
