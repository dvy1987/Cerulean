---

# Product Requirements Document

## Product Name (Working): Cerulean

**Tagline**

Turn AI conversations into structured documents without losing the thinking behind them.

---

# 1. Product Overview

Cerulean is a thinking workspace that allows users to:

- explore ideas through AI conversations
- capture insights without breaking thinking flow
- revisit and deepen ideas in progress later
- transform and incorporate curated ideas into structured documents

Unlike tools such as ChatGPT, Notion, or Google Docs, Cerulean separates writing into **three explicit stages**:

```
Exploration → Idea Capture → Structured Composition
```

This allows users to think freely without losing insights or manually reconstructing conversations.

---

# 2. Problem Statement

Professionals increasingly think with AI tools.

However, these tools mix **thinking and writing**, causing major friction.

Typical workflow today:

```
Discuss idea with AI
↓
Scroll long chat history
↓
Manually extract useful points
↓
Copy paste into document
↓
Rewrite everything into structure
```

Problems caused:

- important ideas get lost in chat
- reasoning chains disappear
- writing becomes manual reconstruction
- AI summaries compress useful insights
- conversations cannot easily evolve into documents

Users need a system where **thinking and writing are connected but not conflated**.

---

# 3. Product Philosophy

Cerulean is not an AI writer.

It is a **thinking operating system for documents**.

Principles:

### 1. Thinking must stay flexible

Conversation should remain exploratory.

### 2. Ideas must never be lost

Insights must be captured instantly without disrupting flow. Users can capture insights from chats, manually or by adding documents or text that feel relevant. 
Users can upload external documents. The AI should extract: supporting ideas, contradictions and new insights. Extracted insights go to the Insight Tray.

These insights can be brought into the active chat space where they can be deepened and users can select/highlight parts of the text/discussion that they want to promote to the main document. If the thought thread is still unfinished, users can relegate it back to the insights capture tray.

### 3. Writing must remain controlled

Only the user promotes ideas into the document.

### 4. AI assists but does not dominate

AI integrates ideas but does not overwrite thinking.

---

# 4. Target Users

## Primary

Product managers and founders writing:

- PRDs
- strategy documents
- product memos
- product analysis

## Secondary

Writers creating:

- essays
- think pieces
- analytical articles
- research notes

---

# 5. Core Product Model

The system revolves around **three core surfaces**.

```
Conversation (exploration)
Insight tray (idea/thinking backlog)
Document (structured output)
```

Each surface represents a stage of thinking.

---

# 6. Core Workspace Layout

Primary workspace UI:

```
------------------------------------------------
| Chat (left)           | Document (right)     |
|                       |                      |
|                       |                      |
|                       |                      |
------------------------------------------------
| Insight Tray (bottom)                        |
------------------------------------------------
```

Top navigation contains:

```
Workspace selector
Conversation tabs
Import document
Export document
```
 Users can import external documents. The AI should extract: supporting ideas, contradictions and new insights. Extracted insights go to the Insight Tray.

The UI must remain **minimal, clean, and visually calm**.

Only one primary font with different font sizes for headings, italics, underlining for emphasis etc.

---

# 7. Core Objects in the System

## Message

Represents a chat message.

```
message_id
conversation_id
role (user | ai)
content
timestamp
```

---

## Insight

Represents an idea captured during thinking, added manually by the user or a document or text imported by the user.

```
id
title
summary
status
conversation_id
user_id
created_at
updated_at
```

Insight statuses:

```
captured
discussing
resolved
promoted
archived
```

---

## Document

Represents the structured output.

```
document_id
title
created_at
updated_at
```

---

## Document Block

Documents are composed of blocks.

```
block_id
document_id
content
block_type
linked_insights[]
source_messages[]
```

Block types:

```
heading
paragraph
bullet
section
```

---

---

DOCUMENT STORAGE RULE

Documents must be stored as structured blocks.

Never store documents as a single text field.

Each block must contain:

block_id
block_type
content
linked_insights
source_messages

This structure enables promotion, reasoning tracking,
and AI integration. This is to help with the idea provenance of the block and also to help with the knowledge graph.

# Critical Interaction Spec

## Highlight Capture Menu

When the user highlights text inside the **chat panel**, a contextual menu must appear.

This is the **primary capture mechanism**.

### UI Behavior

```
User highlights text in chat message
↓
Context menu appears
```

Menu options:

```
Promote to Document
Save Insight
```

---

# Action 1 — Promote to Document

Purpose:

User believes the text represents **a refined idea that should become part of the document immediately**.

### Flow

```
Highlight text
↓
Promote to Document
↓
AI integrates into document
↓
Document updates
```

AI responsibilities:

1. Determine where does it fit in the graph and update the graph accordingly
2. Determine appropriate document section
3. Adapt tone
4. Integrate with surrounding content
5. Update structure if necessary

Critical rule:

```
Do not regenerate entire document.
```

Only required edits allowed.

AI changes must appear highlighted in light blue in the document.

User must approve or reject the patch by choosing between a single green checkmark and a red cross.

Accept applies edits.

Reject restores previous version.

---

# Action 2 — Save Insight

Purpose:

The idea is **interesting but not yet fully explored**.

### Flow

```
Highlight text
↓
Save Insight
↓
Insight stored
↓
Insight appears in Insight Tray
```

Insight properties stored:

```
id
title
summary
status = captured
conversation_id
user_id
created_at
updated_at
```

The insight is **not discussed immediately**.

It becomes part of the **thinking backlog**.

---

# Manual Insight Creation

Yes — this is also essential.

The user must be able to capture ideas **without interrupting conversation**.

### UI Interaction

In the insight tray:

```
+ Add Insight
```

User types:

```
"What if onboarding uses freemium instead?"
```

Result:

```
Insight created
status = captured
```

The conversation continues uninterrupted.

users can add documents doc, docx, .md, .txt and pdf to the insights tray also.  The AI should extract: supporting ideas, contradictions and new insights. Extracted insights go to the Insight Tray.

---

# Using Insights Later

Insights act as **future discussion seeds**.

When the user clicks an insight:

```
Insight → Chat prompt
```

Example:

Insight:

```
Define activation metric
```

Auto-generated prompt:

```
Let's explore how we should define the activation metric for this product.
```

User can edit before sending.

Users can then continue by choosing ideas/chat/text blocks to promote, have more discussion of a specific point, extract more insights from the chat into the insight tray etc. The insights added from the chat become new, independent insights.

---

# Why These Two Interactions Are Crucial

These two capture paths correspond to **two different thinking states**.

### Promote to Document

Used when idea is **ready for articulation**.

### Save Insight

Used when idea is **still exploratory**.

Without both, users either:

- prematurely write
- or lose ideas

---

# Final UX Summary

During conversation the user has **three possible actions**.

```
1. Promote to Document
2. Save Insight
3. Continue Conversation
```

Outside conversation:

```
4. Manually Add Insight via text or via document
```

---

# The Core Thinking Loop

Your product loop becomes:

```
Chat with AI
↓
Capture insight
↓
Insight tray backlog
↓
Select insight to explore
↓
Conversation
↓
Promote to document
```

That loop is the **heart of the product**.

---

# One Tiny UX Improvement

When a user captures an insight, show a small confirmation animation.

Example:

```
✓ Insight saved
```

And the insight tray counter updates:

```
Insights (5)
```

This gives the user the feeling:

> “I just captured something important.”
> 

It sounds small but it dramatically improves **perceived intelligence of the product**.

---

# 8. Insight Tray (Thinking Backlog)

The insight tray is a **parking lot for ideas**.

It acts as a backlog of ideas to explore later.

Important behaviors:

- tray is collapsed by default
- expanding reveals insights
- insights are ranked by AI relevance to the document. Relevance can evolve with the document
- users can override ranking

Example tray:

```
Insights (6)

1. Define activation metric
2. Freemium onboarding strategy
3. Reduce signup friction
4. Value in first 5 minutes
5. Onboarding experiments
```

Insights can originate from:

- highlighted conversation text
- manual input
- imported documents
- AI suggestions

---

# 9. Capturing Insights

Insights can be captured in three ways.

---

## Method 1 — Highlight to Capture

User highlights text in conversation.

Menu appears:

```

Promote to Document
Save Insight
```

Selecting **Save Insight** sends it to the tray.

---

## Method 2 — Manual Insight Entry

Users can add ideas directly via chat or by importing/adding an external document.

Example:

```
+ Add Insight
```

Purpose:

Capture ideas without interrupting conversation.

---

## Method 3 — AI Suggested Insights

AI occasionally marks high-value insights.

Constraints:

- suggestions must be rare
- user must confirm
- avoid clutter

---

# 10. Starting New Discussions from Insights

Insights act as seeds for future conversations.

When user selects an insight:

The system converts it into a chat prompt.

Example:

Insight:

```
Define activation metric
```

Prompt generated:

```
Let's explore how we should define the activation metric for this product.
```

User can edit prompt before sending.

---

# 11. Promoting Insights to the Document

Insights can be promoted into the document.

Promotion methods:

- highlight text → promote
- promote insight from tray

When promotion occurs, AI performs integration.

---

# 12. AI Document Integration

When an insight is promoted:

AI performs four steps.

1. Identify best section
2. Adapt tone to document
3. Integrate with surrounding content
4. Update structure and knowledge graph if necessary

Critical constraint:

```
The entire document must never be rewritten/regenerated automatically.
```

Only required edits are allowed.

---

# 13. Document Editing

The document pane supports structured editing.

Users can:

- rewrite sections
- add new sections
- remove content
- expand ideas with AI

AI assistance includes:

```
expand argument
add example
add counterpoint
clarify language
```

---

# 14. Traceable Reasoning

Every document block stores its origin.

Metadata:

```
source insights
source messages
```

Users can inspect reasoning through a side panel.

Inspector view shows:

```
origin conversation
supporting insights
related questions
```

This feature is hidden by default to avoid UI clutter.

---

# 15. Knowledge Graph

The knowledge graph is a tab that users can switch to. The system builds a background idea graph.

Nodes include:

```
insights
questions
arguments
document sections
```

Edges include:

```
supports
contradicts
expands
```

The graph updates automatically as conversations evolve.

Users can optionally view the graph.

---

# 16. Contradiction Detection

The system identifies conflicting insights.

Example:

```
Insight A: reduce onboarding steps
Insight B: add onboarding tutorial
```

AI flags contradiction and suggests discussion.

---

# 17. AI-Guided Thinking Suggestions

The system periodically suggests next exploration topics.

Example:

```
Continue Thinking

• Define activation metric
• Explore freemium onboarding
• Analyze risks
```

These suggestions come from:

- unresolved insights
- document gaps
- contradictions
- conversation context

Suggestions appear above the chat input as pills. users can convert a pill prompt into an insight and add to insight tray if they want

---

# 18. Document Import

Users can import external documents.

Supported formats:

```
markdown
plain text
```

AI performs analysis:

- extract insights
- detect supporting ideas
- identify contradictions
- identify missing topics

Extracted insights are placed in the insight tray.

---

# 19. Resume Sessions

When users return to a workspace they can:

```
resume previous conversation
explore stored insights
start new conversation
```

This ensures continuity of thinking.

---

# 20. Export Options

Documents can be exported as:

```
Markdown
Plain text
PRD format
```

Example PRD structure:

```
Problem
User Pain
Proposed Solution
Tradeoffs
Metrics
Open Questions
```

---

# 21. System Architecture

Frontend

```
Next.js
Tailwind
TipTap editor
Zustand state
dnd-kit drag
```

Backend

```
Node API
Supabase database
```

AI integration

Uses

OpenAI API

---

# 22. AI Prompt Systems

AI prompts include:

### Conversation Prompt

Encourage deep reasoning.

### Insight Suggestion Prompt

Detect high-value insights.

### Document Integration Prompt

Insert promoted insights naturally.

### Contradiction Detection Prompt

Identify conflicting ideas.

### Thinking Suggestion Prompt

Recommend next discussion topics.

---

# 23. MVP Scope

The first version should include:

```
chat system
highlight capture
manual insights
insight tray
document editor
promotion engine
export
knowledge graph ui
```

Optional for later release:

```

contradiction engine
document import
advanced ranking
```

---

# 24. Success Metrics

Metrics are not required for MVP implementation.

Primary metric:

```
Insights promoted per session
```

Secondary metrics:

```
documents exported
session duration
repeat usage
```

---

# 25. Long-Term Vision

Cerulean becomes the workspace where professionals:

```
think with AI
capture insights
structure reasoning
produce high-quality documents
```

Instead of separating thinking tools and writing tools, the product unifies them into a single workflow.

---

# Minimal Database Schema (V1 with Graph)

Core tables:

```
users
conversations
messages
insights
documents
document_blocks
graph_nodes
graph_edges
patches
document_versions
```

This is **10 tables**, but only **5 store real content**.

---

# Table: users

Basic authentication.

```sql
users
```

Fields:

```
id (uuid, primary key)
email
created_at
```

---

# Table: conversations

Conversation sessions.

```sql
conversations
```

Fields:

```
id (uuid)
title
user_id
created_at
updated_at
```

---

# Table: messages

Stores chat history.

```sql
messages
```

Fields:

```
id (uuid)
conversation_id
role (user | assistant)
content
created_at
```

---

# Table: insights

Represents items in the Insight Tray.

```sql
insights
```

Fields:

```
id (uuid)
title
summary
status
conversation_id
user_id
created_at
updated_at
```

Status values:

```
captured
discussing
resolved
promoted
archived
```

Optional helpful fields:

```
source_message_ids (array)
```

---

# Table: documents

Represents structured documents.

```sql
documents
```

Fields:

```
id (uuid)
title
user_id
created_at
updated_at
```

---

# Table: document_blocks

Documents stored as structured blocks.

```sql
document_blocks
```

Fields:

```
id (uuid)
document_id
parent_block_id
type
content
position
created_at
updated_at
```

Block types:

```
section
heading
paragraph
bullet
```

This structure allows:

```
moving sections
patch updates
AI insertions
```

---

# Table: graph_nodes

Represents entities in the knowledge graph.

Important rule:

Graph nodes reference **existing entities**.

```sql
graph_nodes
```

Fields:

```
id (uuid)
node_type
entity_id
label
created_at
```

node_type values:

```
message
insight
document_block
topic
```

Example:

```
node_type = insight
entity_id = insights.id
```

---

# Table: graph_edges

Represents relationships between nodes.

```sql
graph_edges
```

Fields:

```
id (uuid)
source_node_id
target_node_id
relationship_type
created_at
```

relationship_type values:

```
supports
contradicts
expands
references
derived_from
```

Example relationship:

```
Insight → supports → DocumentBlock
```

---

# Table: patches

Stores AI edits before user approval.

```sql
patches
```

Fields:

```
id (uuid)
document_id
operations (json)
status
created_at
```

Status values:

```
pending
accepted
reverted
```

Operations example:

```
update_block
insert_block
move_block
delete_block
```

---

# Table: document_versions

Snapshot history.

```sql
document_versions
```

Fields:

```
id (uuid)
document_id
snapshot
change_summary
created_at
```

Snapshots store:

```
JSON representation of document_blocks
```

---

# Graph Relationships Example

Example graph inside the system:

```
Message
   ↓ derived_from
Insight
   ↓ supports
Document Block
```

Another example:

```
Insight A
   ↓ contradicts
Insight B
```

---

# How Graph Is Created

Graph nodes are created when:

```
message created
insight created
document block created
topic detected
```

Edges are created when:

```
insight derived from message
insight promoted to document
AI detects relationship
```

---

# Graph Query Examples

Find insights related to a section:

```
DocumentBlock → supports → Insight
```

Find contradictions:

```
Insight → contradicts → Insight
```

Trace reasoning:

```
DocumentBlock
↓ supports
Insight
↓ derived_from
Message
```

---

# Why This Schema Is Good

It keeps the system:

```
simple
extensible
graph-ready
AI-friendly
```

But avoids duplicating data.

Graph tables only store **relationships**.

---

# The Most Important Rule

Add this rule to the PRD:

```
Graph nodes must reference existing entities.

The graph must never store duplicate content.

The graph acts as a relationship layer only.
```

---

# Final Architecture Overview

Your system becomes:

```
messages
   ↓
insights
   ↓
document_blocks
```

With graph tracking relationships:

```
graph_nodes
graph_edges
```

And editing controlled by:

```
patches
document_versions
```

---

UI CONSISTENCY RULE

The interface must remain minimal and visually calm.

Rules:

- Use a single primary font.
• Avoid complex visual components.
• Use subtle highlighting for AI changes.
• Keep panels clean and spacious.

The product should feel closer to a calm writing tool
than a complex dashboard.

SIMPLICITY RULE

Agents must avoid adding new concepts or entities
beyond what is defined in this document.

Core entities are:

Conversation
Insight
Document
DocumentBlock

If additional structures are needed, they must extend
these entities rather than introducing new ones.

The system should remain easy to understand
for first-time users.