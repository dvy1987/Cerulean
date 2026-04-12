# Speclet: Visual Relevance and Maturity Indicators on Insight Cards

Status: Approved
Date: 2026-04-12
Depends on: *LLM-Scored Relevance and Maturity* speclet

## Problem

Insight Cards currently display a status badge (captured / discussing / resolved / promoted / archived) and a colored left border accent. There is no visual signal telling the user which insights are most relevant to their document or how mature an idea is. Users must read every card to decide what to work on next.

## Goal

Add lightweight, non-intrusive visual indicators to each Insight Card that communicate relevance and maturity at a glance, without adding clutter or breaking the calm aesthetic.

## Design Approach: Glowing Relevance Dot + Maturity Bar

Each Insight Card gets two new visual elements:

### 1. Relevance Dot (top-right area, next to status badge)

A small colored circle (8px) that communicates relevance intensity through color:

| Relevance Score | Dot Color | Meaning |
|----------------|-----------|---------|
| 0 (unscored) | `gray-300` | Scoring pending |
| 1 -- 3 | `gray-400` | Low relevance |
| 4 -- 6 | `cerulean-400` | Medium relevance |
| 7 -- 8 | `cerulean-500` | High relevance |
| 9 -- 10 | `cerulean-600` with subtle glow | Top relevance |

The glow effect on 9-10 scores uses a `box-shadow` ring in `cerulean-300/50` to draw the eye without being loud. The dot sits inline with the status badge, separated by a small gap.

### 2. Maturity Bar (bottom of card, above action buttons)

A thin (2px tall) horizontal progress bar spanning the card width (with card padding). It fills proportionally to the maturity score (0-10 mapped to 0-100%).

| Maturity Score | Bar Color | Fill |
|---------------|-----------|------|
| 0 (unscored) | No bar shown | 0% |
| 1 -- 3 | `warning-300` | 10-30% |
| 4 -- 6 | `cerulean-300` | 40-60% |
| 7 -- 8 | `cerulean-400` | 70-80% |
| 9 -- 10 | `success-400` | 90-100% |

The bar has a `rounded-full` shape and sits in a `gray-100` track. At maturity 0 (unscored), the bar is hidden entirely to avoid visual noise on brand-new insights.

### Unscored state (score = 0)

When both relevance and maturity are 0 (the insight was just created and the scoring agent has not yet run):
- The relevance dot renders in `gray-300` (muted, clearly "pending").
- The maturity bar is hidden.
- The card appears at the bottom of the tray in creation order (per the scoring speclet).

This prevents flickering or misleading indicators before real scores arrive.

## Tooltip on Hover

Both the relevance dot and the maturity bar show a simple title-attribute tooltip on hover:

- Dot: "Relevance: 7/10" (or "Relevance: scoring..." when 0)
- Bar: "Maturity: 5/10" (hidden when 0, so no tooltip needed)

No custom tooltip component is needed; native `title` attributes keep it simple.

## InsightCard Component Changes

### New props

```typescript
interface InsightCardProps {
  insight: Insight;  // now includes relevance and maturity fields
  onPromote: (insight: Insight) => void;
  onArchive: (insightId: string) => void;
  onExplore: (insight: Insight) => void;
  hasContradiction?: boolean;
}
```

No new props are needed because `relevance` and `maturity` are read directly from the `Insight` object, which already gets passed as a prop.

### Relevance dot rendering

Placed inside the existing `flex items-start justify-between` header div, between the title area and the status badge:

```
[Title + content]  [dot] [status badge]
```

The dot is a `span` with `w-2 h-2 rounded-full shrink-0` plus the computed color class. For score 9-10, add `shadow-[0_0_4px_rgba(var(--cerulean-300-rgb),0.5)]`.

### Maturity bar rendering

Placed after the content area, before the action buttons div:

```
[Title]
[Content preview]
[Contradiction label if any]
[Maturity bar]          <-- new
[Action buttons on hover]
```

Only renders when `maturity > 0`:

```html
<div class="mt-2 h-0.5 bg-gray-100 rounded-full overflow-hidden">
  <div
    class="h-full rounded-full {colorClass}"
    style="width: {maturity * 10}%"
  />
</div>
```

### Color helper

A small utility function inside InsightCard (not extracted to a separate file since it is only used here):

```typescript
function getRelevanceDotClass(score: number): string {
  if (score === 0) return "bg-gray-300";
  if (score <= 3) return "bg-gray-400";
  if (score <= 6) return "bg-cerulean-400";
  if (score <= 8) return "bg-cerulean-500";
  return "bg-cerulean-600 shadow-[0_0_4px_rgba(56,189,248,0.5)]";
}

function getMaturityBarClass(score: number): string {
  if (score <= 3) return "bg-warning-300";
  if (score <= 6) return "bg-cerulean-300";
  if (score <= 8) return "bg-cerulean-400";
  return "bg-success-400";
}
```

## Animation

When scores update (after a batch scoring run), the dot color and bar width transition smoothly:

- Dot: `transition-colors duration-500`
- Bar fill: `transition-all duration-700 ease-out`

This creates a subtle "scores settling in" effect after the background agent runs, giving the tray a sense of intelligence.

## Interaction with Existing Visual Elements

### Status badge (unchanged)

The status badge continues to show the lifecycle state (captured, discussing, etc.). Relevance and maturity are orthogonal dimensions -- a "captured" insight can have high relevance, and a "discussing" insight can have low maturity if the discussion just started.

### Left border accent (unchanged)

The left border continues to reflect status color. It does not change based on scores.

### Contradiction styling (unchanged)

Cards with contradictions keep the danger border treatment. The relevance dot and maturity bar render normally within the danger-styled card.

## What This Does NOT Cover

- Score computation logic (see companion speclet: *LLM-Scored Relevance and Maturity*).
- Changes to the Insight Tray sort order (handled in the scoring speclet).
- Any database persistence of scores.
- Mobile-specific layout adjustments (the dot and bar scale naturally with the card grid).
