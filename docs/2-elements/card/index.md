# Card

Responsive grid of items with optional cover image and title.

## In this section

- [[cover|Cover]] — Cover image from a configured property, with fit and aspect-ratio options.
- [[2-elements/card/data|Data]] — Card data options — size, image property, image fit, aspect ratio.
- [[grid|Grid]] — Responsive column grid whose minimum cell width follows the card size option.
- [[2-elements/card/implementation|Implementation]] — Bases view type ids for Card S, Card L, and Picture Gallery.

## Purpose

Card layouts for files and images — Card S, Card L, and Picture Gallery. Used in folder indexes.

## Appearance

```
┌────────┐ ┌────────┐
│ cover  │ │ cover  │
│ title  │ │ title  │
└────────┘ └────────┘
```

**Card S** — compact title. **Card L** — larger title. **Picture Gallery** — image only; no title chrome; no borders.

## Chrome

Usually none beyond [[2-elements/embed-chrome/index|Embed Chrome]].

## Examples

- Folder file lists — `┼/Bases/Contents.base#Files`.

## Roadmap

- Vault examples (`┼/Bases/Contents.base`)
- Card L vs Card S title tier rules

# Elements

* [Data](data.md) - Card data options — size, image property, image fit, aspect ratio.
* [Implementation](implementation.md) - Bases view type ids for Card S, Card L, and Picture Gallery.
