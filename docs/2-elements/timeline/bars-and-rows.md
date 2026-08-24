---
type: Element
title: Bars and Rows
description: Row anatomy — title label left, bar spanning start to end date right — and row sizes.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Bars and Rows

Parent: [[2-elements/timeline/index|Timeline]]

## Row

- Title label on the bar centerline (opens note on click); long titles may extend past the bar and cover the end date.
- Horizontal bar from start date to end date, with circled day-of-month markers at each endpoint.

## Row size

**XS** through **XL** adjust row gap and bar title size/weight via layout tokens. **XL** matches theme **h1** (`--nui-h1`). The folder hub [[collapse-chevron]] does not scale with row size.

## Project folders

A folder whose hub note has dates appears as a project folder row. When that folder contains other dated notes (or nested project folders), the row shows a [[collapse-chevron]] left of the title. Chevron toggles child row visibility; title click opens the hub note.

The toolbar **Folders** control shows or hides contents of all top-level project folders at once. Off by default: only top-level project folders and loose files in the timeline folder remain. On: nested notes and subfolders are visible (per-row chevrons still apply).

## Editing

When start and end are writable note properties:

- Drag bar — move in time (preserves span).
- Drag a folder hub bar — moves the entire folder subtree in time, including collapsed and nested items.
- Drag handles — change start or end; multi-selection moves the same edge on all selected bars. Folder hub edge drag affects only the hub note bar, not its children.

## Omission

Notes without a valid start date are not drawn. Missing end defaults to start.

