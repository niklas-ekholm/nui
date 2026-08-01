---
type: Element
title: Filter Field
description: Underlined field filtering visible rows by bar title or path without changing the date range.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Filter Field

Parent: [[2-elements/timeline/index|Timeline]]

Underlined field left of the date range. Filters visible rows by bar title or file path. Does not change the visible date range.

## Behaviour

- Typing narrows rows immediately.
- **×** at the end clears the filter when text is non-empty.
- **Escape** while focused in the field clears the filter when text is non-empty.
- Escape from the chart (when the field is not focused) does not clear the filter.

## Element

[[search-field]] — fixed width, bottom rule, clear control.

