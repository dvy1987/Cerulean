# UX Overhaul Plan

Status: Ready to execute
Date: 2026-04-09

## Problem

The current UI is functional but uninspiring. White-on-white everywhere, no depth, no personality, no transitions. The PRD says the app should feel like "a calm writing tool" but right now it feels like "an unstyled prototype."

## Guiding Principles

- Single font: Inter throughout, properly imported via Google Fonts
- Calm but not lifeless: subtle gradients, soft shadows, gentle transitions
- Depth through layering: use shadow, background tints, and border treatments to separate surfaces
- Micro-interactions: hover states, smooth transitions, focus rings
- Respect the PRD: minimal, clean, visually calm -- but polished

## Changes

### 1. Font & Global CSS

- Import Inter from Google Fonts in layout.tsx (weights 400, 500, 600)
- Expand CSS variables: add shadow tokens, transition defaults, subtle background tints
- Add smooth transition defaults to interactive elements
- Better scrollbar styling

### 2. Tailwind Config

- Add animation keyframes: fadeIn, slideUp, slideDown
- Add boxShadow tokens: soft, medium, lifted
- Add transition utilities

### 3. Header (Workspace.tsx)

- Subtle bottom shadow instead of hard border
- Cerulean brand text with slightly larger sizing and tracking
- Group action buttons with subtle separator
- Hover states with background tints

### 4. Chat Module

**ChatPanel:**
- Better empty state: larger text, subtle icon, clear CTA
- Subtle background tint (gray-50) to differentiate from document panel

**ChatMessage:**
- User messages: cerulean-500 with subtle shadow
- AI messages: white card with soft shadow and left accent border
- Smooth fade-in animation on new messages

**ChatInput:**
- Taller input with better padding
- Subtle shadow on focus
- Send button with hover scale effect

**HighlightMenu:**
- Frosted glass effect (backdrop-blur)
- Better shadow and rounded corners
- Button hover states with color fills

**ThinkingSuggestions:**
- Better pill styling with hover scale
- Subtle left border accent on the section

### 5. Document Module

**DocumentPanel:**
- Warm background tint (stone-50/warm gray) to feel like a writing surface
- Better empty state with visual hierarchy
- Export dropdown with shadow and better spacing

**DocumentBlockView:**
- Subtle left border accent on hover (instead of just bg change)
- Better editing state with visible border
- AI menu with frosted glass treatment

**PatchReview:**
- Full-width banner with gradient background
- Larger accept/reject buttons with icons
- Operation list with monospace-style formatting

### 6. Insights Module

**InsightTray:**
- Taller max-height (80 instead of 64)
- Better header with count badge styling
- Smooth slide transition on open/close
- Contradiction banner with stronger visual treatment

**InsightCard:**
- Subtle left color accent bar based on status
- Better hover elevation (shadow on hover)
- Status badge with better typography

### 7. Graph Module

**GraphView:**
- Better empty state matching other panels
- Subtle gradient background
- Remove purple from node colors (replace with teal)

### 8. Settings & Modals

**SettingsPanel:**
- Better section headers
- Toggle switches with smooth transition
- Status indicators with better color treatment

**ExemplarUpload:**
- Better modal with shadow and rounded corners
- Upload area with dashed border animation on hover
- Better file list styling

## What We Are NOT Doing

- No avatars in chat
- No animated typing indicator
- No multiple fonts
- No dark mode (not requested)
- No structural layout changes (keeping the 50/50 split per PRD)
