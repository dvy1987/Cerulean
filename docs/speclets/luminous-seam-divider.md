# Luminous Seam Divider (Option E)

## Overview

Replace the current solid groove bar and floating file-tab handle with a single 1px luminous line that fades to transparent at its top and bottom edges, glows softly on hover, and intensifies while dragging. The existing wide proximity zone (~20px each side) stays for easy grabbing, but the visual is radically simpler -- just a living line of light.

---

## Implementation Steps

### 1. Restyle the Groove Line in globals.css

- Replace the current `.groove-divider` styles (3px wide, gradient fill, inset shadows) with a 1px-wide element that has no background color of its own
- Add a pseudo-element (`::after`) that draws a 1px vertical line using a top-to-bottom gradient: fully transparent at both ends, fading to `gray-200` in the center third -- creating the "fades out at the edges" effect
- On `.groove-divider:hover` (or when a `.groove-hover` class is applied via proximity detection), transition the center gradient color from `gray-200` to `cerulean-200` and add a narrow `box-shadow` glow: something like `0 0 6px rgba(0, 144, 240, 0.15)` on the pseudo-element
- Add a `.groove-active` variant for the dragging state that intensifies the glow to `0 0 8px rgba(0, 144, 240, 0.25)` and shifts the center gradient color to `cerulean-300`
- All transitions should use `transition: all 200ms ease` for smooth state changes
- Remove the existing `.groove-divider` and `.groove-divider.groove-active` rules entirely and replace them

### 2. Simplify the Divider Element in Workspace.tsx

- Change the divider container width from `w-[3px]` to `w-px` (1px) to match the new ultra-thin seam concept
- Remove the entire floating file-tab handle block (the `div` with the three dots, approach-side positioning, rounded corners, border, and shadow)
- Remove the `approachSide` state variable and the `lastDragX` ref since the tab-side tracking logic is no longer needed
- Remove the approach-side tracking code from `handlePointerMove` (the `delta`/`setApproachSide` block)
- Keep the `isNearDivider` state and `handleProximityMove` callback -- these are still needed to toggle the glow
- Apply the `groove-hover` class to the divider element conditionally based on `isNearDivider` being true (so the CSS glow kicks in when the mouse is within the proximity zone, not just on direct hover)
- Apply the `groove-active` class conditionally based on `isDragging` being true

### 3. Keep the Wide Hit Area

- Retain the invisible expanded hit-target overlay (`absolute inset-y-0 -left-[18px] -right-[18px]`) so the divider is still easy to grab from ~20px away
- Keep the `PROXIMITY_PX = 20` constant and the `handleProximityMove` logic that sets `isNearDivider`
- Keep the `onPointerLeave` handler that clears `isNearDivider` when the mouse exits the container

### 4. Clean Up Unused State and Logic

- Remove the `approachSide` useState declaration
- Remove the `lastDragX` useRef declaration
- Remove the `lastDragX.current = e.clientX` assignment in `handlePointerDown`
- Remove the `lastDragX.current = null` in `handlePointerUp`
- Remove the approach-side detection branch in `handleProximityMove` -- simplify to just setting `isNearDivider`

### 5. Verify and Test

- Run a production build to confirm no TypeScript or compilation errors
- Manually verify in the browser that:
  - The divider appears as a subtle 1px line that fades at its top and bottom
  - When the mouse comes within 20px, a soft cerulean glow fades in
  - While dragging, the glow intensifies
  - Dragging still works from the wider invisible hit zone
  - The collapsed-panel restore buttons still function correctly

---

## CSS Specification

### Divider Line Gradient (vertical, top to bottom)

- Default: `transparent -> gray-200 -> transparent` (fade in center third)
- Hover/Near: `transparent -> cerulean-200 -> transparent`
- Dragging: `transparent -> cerulean-300 -> transparent`

### Glow Effect (box-shadow on pseudo-element)

- Default: none
- Hover/Near: `0 0 6px rgba(0, 144, 240, 0.15)`
- Dragging: `0 0 8px rgba(0, 144, 240, 0.25)`

### Transitions

- All state changes: `transition: all 200ms ease`

### Hit Target

- Invisible overlay: ~20px on each side of the 1px line
- Cursor: `col-resize` within hit zone

---

## Design Rationale

This approach strips the divider down to its absolute minimum visual footprint -- a single pixel-wide line that fades at its edges and responds to proximity with a soft cerulean glow. It removes all the file-tab handle complexity (approach-side tracking, floating tab positioning, three-dot indicators) in favor of pure light. The wide 20px proximity hit zone stays intact so the interaction remains forgiving and easy. The result should feel premium and almost invisible until you need it.

## Open Question

Should the glow use the cerulean brand color as described above, or a neutral warm white glow (like `rgba(255, 255, 255, 0.4)`) to keep it more subtle and color-agnostic?
