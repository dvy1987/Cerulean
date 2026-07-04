# Knowledge Graph Report

Generated: 2026-07-04T14:12:08.483496+00:00
Mode: skill-library | Nodes: 258 | Edges: 305

**Why this mode:** skill-library label: docs/skill-graph.md + docs/SKILL-INDEX.md present → adds authoritative skill invoke edges. Still scans full repo (not skills-only).

## God nodes (skills + modules)
- secure-skill
- universal-skill-creator
- types.ts (module)
- venture-exploration
- registry.ts (module)
- experimentation
- actions.ts (module)
- validate-skills
- index.ts (module)
- improve-skills

## Surprising cross-community connections
- project-orchestrator → skill-routing (invokes: project ↔ skill)
- project-orchestrator → process-decomposer (invokes: project ↔ process)
- publish-skill → validate-skills (invokes: publish ↔ validate)
- publish-skill → improve-skills (invokes: publish ↔ improve)
- customer-discovery → venture-exploration (invokes: customer ↔ venture)
- reality-check → assumption-mapping (invokes: reality ↔ assumption)
- reality-check → adversarial-hat (invokes: reality ↔ adversarial)
- business-modeling → venture-exploration (invokes: business ↔ venture)

## Suggested questions
- How does project-orchestrator (project) connect to skill-routing (skill)?
- How does project-orchestrator (project) connect to process-decomposer (process)?
- How does publish-skill (publish) connect to validate-skills (validate)?
- What depends on secure-skill, and what does secure-skill invoke?
- What depends on universal-skill-creator, and what does universal-skill-creator invoke?
- What depends on types.ts (module), and what does types.ts (module) invoke?

## Provenance
- Authoritative invokes: 171
- EXTRACTED: 300 | INFERRED: 5

Query: `python3 .agents/skills/knowledge-graph/scripts/query_graph.py path <A> <B>`
