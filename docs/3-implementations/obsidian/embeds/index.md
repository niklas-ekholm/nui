# Embeds

Every embed type used in the vault — Obsidian defaults and NUI Plugin custom views.

## In this section

- [[3-implementations/obsidian/embeds/default/index|Default]] — Obsidian's native embed types and their syntax.
- [[live-preview-sticky-headers|Live Preview Sticky Headers]] — Keeping full timeline and month tracker headers fixed under pane chrome while the note scrolls.

## Purpose

Catalog of embed types in the vault — native Obsidian blocks and NUI Plugin custom Bases views. Default types live in [[3-implementations/obsidian/embeds/default/index|Default]].

## Width pipes

Any embed may carry pipe modifiers after the link target:

```md
![[photo.png|wide]]

```

`|wide` sets `data-nui-embed-wide` on the embed wrapper. The editor pane is the container query root, not the prose column. Timeline height tokens (`compact`, `full-tasks`) override the base view layout; embedded timelines without a layout pipe use full height.

**Live Preview:** Full timeline and month embeds stick their header band under pane chrome while the note scrolls. See [[live-preview-sticky-headers]].

When the cursor enters an embed, the `![[…]]` source line is painted over the embed (embed at 10% opacity) so the document does not shift by one row.

Clicking empty embed chrome (not links, buttons, cards, or other controls) places the caret at the end of that embed’s source line.

## Roadmap

- Restore trimmed embed detail in `Embeds/Default/` — e.g. Image extension list, Note “vault mostly uses bases” context

# Subdirectories

* [default](default/index.md)
