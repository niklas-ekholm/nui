---
type: Element
title: Selection
description: Figma-style marquee and click selection on the chart body.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Selection

Parent: [[2-elements/timeline/index|Timeline]]

Figma-style selection on the chart body.

| Input | Result |
| ----- | ------ |
| Drag on chart | Marquee-select bars that intersect |
| Shift + drag | Add to selection |
| Click bar | Select that project |
| Shift + click bar | Toggle in selection |
| Click title | Open note |
| Drag bar | Select if needed; move in time (multi: same day offset, spans preserved). Dragging a superproject bar moves the entire folder subtree, including collapsed nested items. |
| Escape | Clear selection |

Selected bars use **accent** fill.
