# Cursor

Cursor is the second NUI platform. A VS Code extension that opens markdown in preview mode by default and applies NUI reading typography to the built-in markdown preview.

Extension source lives in the monorepo at `cursor-extension/`.

## In this section

- [[3-implementations/cursor/install|Install]] — Build a VSIX from the monorepo and load it into Cursor or VS Code.
- [[3-implementations/cursor/dev/index|Dev]] — Build, launch, and package layout for the Cursor extension.
- [[3-implementations/cursor/hotkeys|Hotkeys]] — Preview toggle and editor association overrides.
- [[3-implementations/cursor/nui-preview|NUI Preview]] — Preview CSS — foundation tokens mapped to VS Code markdown preview.

## Purpose

Lightweight platform binding for editing NUI docs and vault markdown outside Obsidian. Maps [[1-foundations/index|1 Foundations]] typography and palette to VS Code's markdown preview; does not ship custom views, embeds, or vault behaviour.

Carbon React analog — one extension artefact instead of Obsidian's theme + plugin split.

## What ships

| Artefact | Responsibility |
| -------- | -------------- |
| `package.json` `contributes` | Default editor association (`*.md` → preview), preview stylesheet registration, toggle command + keybinding |
| `src/extension.ts` | `nui.toggleMarkdownPreview` — switches between preview and source in the active column |
| `media/nui-preview.css` | Reading typography — palette §0, scale §1b, element rules §1c from [[3-implementations/obsidian/nui-theme|NUI Theme]] |

Version **0.1.0**. Publisher: `niklas-ekholm`.

## Default behaviour

Opening a `.md` file lands in VS Code's markdown preview editor (`vscode.markdown.preview.editor`), not the text editor. User settings override the extension default — see [[3-implementations/cursor/hotkeys|Hotkeys]].

Preview content uses NUI type scale (headings, blockquotes, links, inline code). Body text is capped at **700px** width with **18px** root size — same reading column intent as Obsidian reading view.

## Scope boundary

Out of scope by design — same split as [[scope-boundary]] on Obsidian, but the host is thinner:

- No Obsidian Bases views, wikilink embeds, or hub-note navigation
- No NUI Plugin elements (timeline, tracker, cards, list)
- No Live Preview or property chrome — preview only
- Wikilinks render as plain markdown links unless another extension resolves them

For full NUI product behaviour, use [[3-implementations/obsidian/index|Obsidian]].

## See also

- Token source of truth for typography values remains [[3-implementations/obsidian/nui-theme|NUI Theme]] `theme.css` §1b; [[3-implementations/cursor/nui-preview|NUI Preview]] copies the reading-view subset into preview CSS.

## Roadmap

- None

# Subdirectories

* [dev](dev/index.md)
