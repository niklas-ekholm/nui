---
type: Element
title: Grid Layout
description: Grid structure for the year, month, and week variants on desktop and touch.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Grid Layout

Parent: [[2-elements/tracker/index|Tracker]]

| Variant | Structure |
| ------- | --------- |
| Year (desktop) | 4 month columns × 3 rows; 6 week rows per month |
| Year (touch) | 3 month columns × 4 rows; 6 week rows per month; 18px day cells |
| Month | One continuous run of week rows across the scoped months; a label marks each month's first row — [[month|Month]] |
| Week ×3 (desktop) | Rows = habit folders; columns = days across three weeks |
| Week rolling (mobile) | Rows = habit folders; one block of 10 days ending today |

Uses [[divider]] for cell borders.

