# 2 Elements

All UI building blocks — buttons, dividers, cards, timelines, and everything between. An element may contain other elements; that is composition, not a separate doc category.

## In this section

- [[2-elements/card/index|Card]] — Responsive grid of items with optional cover image and title.
- [[2-elements/embed-chrome/index|Embed Chrome]] — Custom toolbar shell for embedded NUI Plugin bases.
- [[2-elements/list/index|List]] — Multi-column list of links — files or folders.
- [[2-elements/table/index|Table]] — Native Obsidian Bases table styling.
- [[2-elements/timeline/index|Timeline]] — Horizontal Gantt-style chart of dated items — the reference element folder.
- [[2-elements/tracker/index|Tracker]] — Habit and calendar grids — year, month, and three-week variants.
- [[2-elements/view-header/index|View Header]] — Title row shared across data views — title left, controls right.
- [[add-button|Add Button]] — The + create control at the far right of a view header topbar.
- [[collapse-chevron|Collapse Chevron]] — One fold control for every expandable subtree — folder trees, heading folds, timeline rows.
- [[divider|Divider]] — Horizontal rule variants for notes, grids, and axes.
- [[ghost-button|Ghost Button]] — Text-only toolbar control with no fill — Today, timespan trigger, restore.
- [[icon-button|Icon Button]] — Square icon-only hit target with ghost treatment.
- [[icon|Icon]] — Pictograms and UI symbols at consistent size and stroke weight. Speculative — not built.
- [[inline-code|Inline Code]] — Monospace code span with pill border and slight vertical shift.
- [[menu|Menu]] — Disclosed command and context-action lists. Speculative — not built.
- [[modal|Modal]] — Focused overlay for confirmations and editors. Speculative — not built.
- [[notification|Notification]] — Transient toast for short-lived status messages. Speculative — not built.
- [[score-chart|Score Chart]] — Line or bar chart of a numeric score property over time, with an optional reference line.
- [[scrub-label|Scrub Label]] — Draggable label that scrubs its bound numeric or date value in place.
- [[search-field|Search Field]] — Fixed-width underline filter input with an optional clear control.
- [[tabs|Tabs]] — Local view switching. Obsidian uses native tabs; NUI defines no custom element yet.
- [[tag|Tag]] — Pill-outline chip with transparent fill for metadata and habit names.
- [[text-input|Text Input]] — Single-line underline-only text field with no box chrome.
- [[title|Title]] — Display-scale title for a view or embed, on the left of the view header.

## Purpose

Elements are what you build with. Document each element once; child notes hold technical depth when needed. Behaviour rules live in [[1-foundations/index|1 Foundations]] (`#designpattern`); tokens live in untagged foundation notes.

Reference depth: [[2-elements/timeline/index|Timeline]] (visual index → child notes → Product recipe → Implementation).

## Roadmap

- Bring non-Timeline elements to Timeline depth — start with [[2-elements/tracker/index|Tracker]] or [[2-elements/card/index|Card]]

# Subdirectories

* [card](card/index.md)
* [embed-chrome](embed-chrome/index.md)
* [list](list/index.md)
* [table](table/index.md)
* [timeline](timeline/index.md)
* [tracker](tracker/index.md)
* [view-header](view-header/index.md)
