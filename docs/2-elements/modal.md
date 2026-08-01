---
type: Element
status: speculative
title: Modal
description: "Focused overlay for confirmations and editors. Speculative — not built."
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Modal

> [!warning] Speculative — not built.
> This note is the design, written to be built against. Nothing here describes shipped code.

Carbon modal analog — focused overlay for confirmations and editors.

## Purpose

Modal element for tasks that need temporary focus outside the main canvas. NUI favours [[drag-to-edit]] and inline edit over modals where possible.

## Uses foundations

- [[color]] — **surface**, **content**, **border**
- [[motion]] — minimal; respect reduced motion

## Implementation

No modal wrapper exists in NUI Plugin. When one is built it wraps the host-native dialog rather than reimplementing it.

## See also

- [[0-philosophy/index|0 Philosophy]] — progressive disclosure over dialogs

## Roadmap

- Document when modals are acceptable vs inline edit
- Stub visual spec if a host-native modal wrapper is needed

