# Embed Chrome

Custom toolbar shell for embedded NUI Plugin bases — replaces host Bases chrome.

## In this section

- [[hover-reveal|Hover Reveal]] — Toolbar fades in when the pointer enters the embed bounds; pointer events off while hidden.
- [[2-elements/embed-chrome/implementation|Implementation]] — Where embed chrome applies across NUI Plugin bases views, including touch overrides.
- [[toolbar-shell|Toolbar Shell]] — Host toolbar slot layout — title left, spacer, then the action cluster.

## Purpose

Shared embed chrome for all NUI Plugin Bases views — hides Obsidian default toolbar and reveals NUI Plugin controls on hover.

## Uses foundations

- [[progressive-disclosure]], [[ghost-chrome]]

## Appearance

Same screen region as Obsidian’s default Bases toolbar. At rest, chrome is invisible until hover over the embed ([[progressive-disclosure]]). Controls use [[ghost-chrome]].

## What is hidden

- Obsidian default Bases toolbar
- **Edit this block** control

## What is shown

NUI Plugin toolbar in the same place — view-specific controls from each layout; [[add-button]] at the right end when the layout defines it.

## Roadmap

- Per-layout create-action table — see [[add-button]]

# Elements

* [Implementation](implementation.md) - Where embed chrome applies across NUI Plugin bases views, including touch overrides.
