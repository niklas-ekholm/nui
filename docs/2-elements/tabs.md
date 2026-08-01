---
type: Element
title: Tabs
description: Local view switching. Obsidian uses native tabs; NUI defines no custom element yet.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Tabs

Carbon tabs analog — switch between views in one region.

## Purpose

Tabs element for local view switching. Obsidian uses native tabs; NUI does not define a custom tab element yet.

## Uses foundations

- [[two-tier-text]] — active tab **content**, inactive **ui**
- [[ghost-chrome]] — no filled tab backgrounds

## Implementation

Obsidian workspace tabs styled in theme.css §4 — workspace tab chrome lives in [[nui-theme]], not the plugin. No NUI Plugin tab element.

## Roadmap

- Document how NUI Theme styles Obsidian tabs vs future custom tab bar

