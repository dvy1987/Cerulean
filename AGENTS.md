# AGENTS.md

This repository contains the Cerulean project.

Cerulean is a thinking workspace that converts AI conversations into structured documents.

The product follows a three-stage thinking model:

Exploration → Insight Capture → Structured Composition

---

## Product Documentation

Product documentation lives in /docs.

PRD:
/docs/PRD.md

Master Prompt and System architecture:
/docs/master-prompt.md

REPO STABILITY RULE

Agents must not refactor or restructure existing modules unless explicitly instructed.

When implementing a feature, modify only the files necessary for that feature.

Do not rename folders, move modules, or reorganize the project structure.

Prefer extending existing modules over creating new architecture.
## Repository Structure

The project uses a modular architecture.

Core folders:

/modules/chat  
/modules/insights  
/modules/document  

Shared utilities:

/components  
/lib  
/store  
/types  

Agents must implement features within the appropriate module.

Do not mix responsibilities across modules.

---

## Core Product Surfaces

The workspace UI contains three panels.

Left panel → Chat  
Right panel → Document  
Bottom panel → Insight Tray  

These surfaces correspond to the three thinking stages.

---

## Core Entities

Conversation  
Insight  
Document  
DocumentBlock  

Agents should not introduce new core entities without necessity.

---

## Development Rules

Agents must implement features incrementally.

Start with the minimal loop:

Chat → Capture Insight → Promote chat text or Insight → Document

Avoid implementing the entire system at once.

---

## Document Structure

Documents must use structured blocks.

Each block contains:

block_id  
block_type  
content  
linked_insights  
source_messages  

Never store documents as a single text field.

---

## AI Development Mode

AI responses should run in development AI mode.
Do not require external API keys yet.

External AI providers will be added later.

All AI integrations must go through a single abstraction layer inside:

/lib/ai

---

## UI Philosophy

Cerulean must remain visually minimal and calm, aligned with a minimal cerulean theme.

Rules:

- single primary font
- minimal visual complexity
- subtle highlighting for AI changes
- avoid dashboard-style UI

---

## Contribution Philosophy

Cerulean prioritizes clarity of thought over feature complexity.

Agents should prefer:

simpler systems  
clear UX flows  
incremental implementation