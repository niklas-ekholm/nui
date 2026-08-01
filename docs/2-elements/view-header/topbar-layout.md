---
type: Element
title: Topbar Layout
description: Zones, spacing, alignment, and what counts as one element in a topbar.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Topbar Layout

Parent: [[2-elements/view-header/index|View Header]]

How controls are placed inside a view topbar — zones, spacing, alignment, and what counts as one element.

## Zones

```
┌────────────────────────────────────────────────────────────┐
│ [Title slot]                    [control][control]… [+]    │
└────────────────────────────────────────────────────────────┘
```

| Zone | Alignment | Content |
| ---- | --------- | ------- |
| **Title slot** | Left | [[title]] — adopted embed heading or standalone filename |
| **Control row** | Right (`flex-end`) | Layout-specific controls in fixed order; [[add-button]] last when present |

Topbar uses `space-between` — title stays left, control row packs to the right.

## Control row

One flat flex row. No nested wrappers that introduce a second gap.

| Rule | Detail |
| ---- | ------ |
| **Uniform gap** | One token between siblings (e.g. `--nui-timeline-control-gap`). Same distance from the ink of each functional element to the next. |
| **One element, one child** | Each functional control is a direct flex child. Order is fixed per layout — see host [[2-elements/list/toolbar|Toolbar]]. |
| **Composite elements** | Multi-part labels that read as one unit are wrapped once — e.g. date range **start–end** is a single child; internal parts have no gap. |
| **Shrink to ink** | Children use `width: fit-content` so the gap sits between element boxes, not empty padding inside a box. |
| **Fixed-width exceptions** | Elements with a defined width (e.g. [[search-field]] at 6rem) keep their spec; gap still applies to the outer box. |
| **Baseline alignment** | Control row uses `align-items: baseline` so text ink lines up across mixed scales. [[add-button]] may use a tighter line-height to sit on the same baseline as **small** [[ghost-button]] neighbours. |

## Add Button

Last child in the control row when the layout defines a create action. Same gap as every other element — not a separate topbar zone.

Week ×3 [[2-elements/tracker/index|Tracker]] is simpler: title slot and [[add-button]] only. Title row uses vertical centre (`align-items: center`) so the **+** aligns with the H1 cap height.

## Examples

| Layout | Control row |
| ------ | ------------- |
| [[Plan]] | filter → date range → ⤶ → timespan → Today → row size → **+** — see [[2-elements/list/toolbar|Toolbar]] |
| [[2-elements/tracker/index|Tracker]] Week ×3 | title → **+** only |

## Implementation (Obsidian)

Timeline: `nui-timeline-topbar` → `nui-timeline-topbar-title` + `nui-timeline-header` (all controls as direct children). Token `--nui-timeline-control-gap` in plugin `styles.css`. Theme colours in `theme.css` §10.

See [[2-elements/view-header/implementation|Implementation]].

