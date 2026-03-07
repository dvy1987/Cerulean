
You are part of a parallel engineering team building a product called **Cerulean**.

Your role is to implement a specific subsystem while respecting the shared architecture and contracts described below.

You must follow the rules strictly to avoid conflicts with other agents.

Initialize the Cerulean project with Next.js + TypeScript + Tailwind.

AI responses should run in development AI mode.
Do not require external API keys yet.

External AI providers will be added later.

---

PROJECT PURPOSE

Cerulean is a thinking workspace that converts AI conversations into structured documents.

Users interact with an AI through chat, capture insights from the conversation, explore those insights later, and promote selected ideas into a structured document.

The product separates three stages of thinking:

Exploration → Idea Capture → Structured Composition

This system should be implemented incrementally.

Start with the minimal working loop:

Chat → Insight Capture → Promote Insight → Document.

---

CORE WORKSPACE LAYOUT

The main workspace has three areas.

Left panel:

Chat conversation with AI

Right panel:

Structured document editor

Bottom panel:

Insight tray (idea backlog)

Layout structure:

Chat | Document

Insight Tray (collapsible and collapsed by default)

---

KEY PRODUCT CONCEPTS

Conversation:

Exploration of ideas with AI.

Insight:

Captured idea from conversation or manual input.

Insight Tray:

Backlog of ideas the user may explore later.

Document:

Structured output built from promoted insights.

Promotion:

User action that moves an idea or a chat block into the document.

AI Integration:

AI integrates promoted ideas into the document while preserving tone and structure.

---

GLOBAL RULES

Rule 1

Never modify files outside your assigned module.

Rule 2

Shared data models must live in /types.

Rule 3

API contracts must be defined before implementation.

Rule 4

Never automatically rewrite the entire document.

Rule 5

The user must always control promotion into the document.

REPO STABILITY RULE

Agents must not refactor or restructure existing modules unless explicitly instructed.

When implementing a feature, modify only the files necessary for that feature.

Do not rename folders, move modules, or reorganize the project structure.

Prefer extending existing modules over creating new architecture.

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
and AI integration.

AI_DOCUMENT_PATCH_RULE

AI must not directly overwrite document content.

All modifications must be returned as a patch.

A patch may contain multiple edits but must be accepted
or rejected as a single unit.

Modified blocks should be visually highlighted
until the user accepts or reverts the patch.

---

TECH STACK

Frontend:

Next.js

React

Tailwind

TipTap editor

Zustand state management

dnd-kit drag system

Backend:

Node.js API

Supabase database

AI integration:

OpenAI API

---

FOLDER STRUCTURE

/app

/components

/modules

/store

/types

/lib

/api

Each subsystem must live in /modules.

Example:

/modules/chat

/modules/insights

/modules/document

---

CORE DATA MODELS

Message

message_id

conversation_id

role

content

timestamp

---

Insight

insight_id

content

status

priority

created_at

source_message

linked_messages

Status values:

captured

discussing

resolved

promoted

archived

---

Document

document_id

title

created_at

updated_at

---

DocumentBlock

block_id

document_id

content

block_type

linked_insights

source_messages

Block types:

heading

paragraph

bullet

section

---

FEATURE RULES

INSIGHT CAPTURE

Users can capture insights in three ways:

1. Highlight text from conversation
2. Manual insight entry
3. AI suggestion (rare)

Captured insights go to the Insight Tray.

---

INSIGHT TRAY

The tray is a backlog of ideas.

It is collapsed by default.

Users can:

expand tray

select insight

promote insight

edit insight

archive insight

Selecting an insight converts it into a chat prompt.

---

CHAT SYSTEM

The chat must support:

streaming responses

message history

highlight capture

conversation persistence

---

DOCUMENT SYSTEM

The document is a structured editor.

Documents consist of blocks.

Users can:

edit text

add sections

remove sections

expand sections using AI

---

PROMOTION ENGINE

When an insight is promoted:

The AI must:

determine best location in the document

adapt tone to match document

integrate idea naturally

update structure if needed

The AI must NOT rewrite/regenerate the entire document.

---

TRACEABLE REASONING

Each document block stores:

linked insights

source messages

This allows the system to track reasoning.

The reasoning inspector UI can be implemented later.

---

AI THINKING SUGGESTIONS

The AI should occasionally suggest next discussion topics.

Suggestions come from:

unresolved insights

contradictions

document gaps

conversation context

Example:

Continue Thinking

Define activation metric

Explore freemium onboarding

Analyze risks

---

DOCUMENT IMPORT

Users can upload external documents.

The AI should extract:

supporting ideas

contradictions

new insights

Extracted insights go to the Insight Tray.

---

EXPORT

Documents must support export as:

Markdown

Plain text

PRD format

---

AGENT RESPONSIBILITIES

Agents will be assigned modules.

Examples:

Chat System

Insight System

Document Editor

Promotion Engine

AI Prompt Engine

Graph Engine

Import System

Each agent must only work within its module.

---

OUTPUT EXPECTATIONS

Each agent must produce:

clean code

modular components

typed data models

clear APIs

basic documentation

---

SUCCESS CRITERIA

The system should allow a user to:

have a conversation with AI

capture ideas without losing flow

revisit insights later

promote ideas into a document

export a structured document

---

Always prioritize simplicity and clarity of user experience.

Cerulean must feel calm, minimal, and focused on thinking rather than feature complexity.

SOURCE OF TRUTH

The following artifacts are the source of truth for the system:

1. Database schema
2. Shared types in /types
3. API contracts

Agents must read these before implementing features.

If a required field or API is missing, the agent must extend the shared types instead of creating private data models.

DEVELOPMENT AI MODE

During development, AI responses should be generated using Warp's available AI capabilities if accessible.

If Warp runtime AI is not available, create a development AI module that simulates intelligent responses.

The goal is to allow the chat interface, insight capture, and document promotion workflows to function without requiring external AI APIs.

External providers (OpenAI, Anthropic, etc.) will be integrated later.