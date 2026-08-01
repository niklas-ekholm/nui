---
type: Foundation
title: Border
description: Border treatments — hairline, bottom rule, pill outline — and where each is used.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Border

Border treatments in NUI.

| Style | Use |
| ----- | --- |
| Hairline | Table columns, grid lines |
| Bottom rule only | Search field underline |
| Pill outline | Tags, inline code |
| Shadow frame | Not used — flat surfaces only |

**Never** on [[ghost-button]] / [[ghost-chrome]] controls, toolbar labels, or embed chrome wrappers — no `border`, `box-shadow`, or filled backgrounds unless the element is explicitly a bordered component (tag, code pill, table grid).

