---
type: Element
title: Toolbar
description: Fixed left-to-right control order in the timeline topbar.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Toolbar

Parent: [[2-elements/timeline/index|Timeline]]

Single control row on the right; title on the left in embeds. Placement rules: [[topbar-layout]]. Order is fixed left-to-right.

| Control | Element | Action |
| ------- | ------- | ------ |
| Filter field | [[search-field]] | Client-side filter by title/path |
| **start–end** | [[scrub-label]] ×2 (one element) | Scrub visible range edges |
| **⤶** | [[ghost-button]] | Default 3-week range from current week Monday |
| Timespan | [[ghost-button]] + menu | **1 week**, **3 weeks**, **1 month**, **3 months**, **6 months**, **1 year** |
| **Today** | [[ghost-button]] | Center range on today (when in range) |
| Folders | [[ghost-button]] | Show or hide contents of top-level project folders |
| Row size | [[scrub-label]] | Horizontal drag through **XS**–**XL** |
| **+** | [[add-button]] | Create `Untitled.md` in `.base` folder |

Opening a `.base` file directly shows filename as title without embed host.

