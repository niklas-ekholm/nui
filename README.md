# NUI

Niklas User Interface — an Obsidian plugin, a theme, and a vault example that
demonstrates both.

The plugin adds fourteen views to [Bases](https://help.obsidian.md/bases): timelines, habit trackers, card grids,
file lists, and a score chart.

The theme is the flat, muted appearance layer those views are drawn against. Each works without the other.

> **Work in progress.** NUI is published so it can be tested. Minor releases will break things.
> The example vault encodes highly opinionated Obsidian settings — a folder-index navigation model, a habits-as-folders convention, and specific frontmatter date properties. Read [INSTALL.md](INSTALL.md) before pointing any of this at a vault you care about.

Requires Obsidian 1.10 or later, which is where the Bases view API became
public.

## Update

To update an existing vault, run this script in terminal inside the vault folder. It installs into the current directory:

```bash
curl -fsSL https://raw.githubusercontent.com/niklas-ekholm/nui/main/scripts/install-remote.sh | bash -s --
```

## Install example

You can also just download the latest [release](https://github.com/niklas-ekholm/nui/releases)
by hand. There are three different zips for three different purposes:

| Zip | Use it when |
| --- | --- |
| `nui-v0.2.4.zip` | A vault with the plugin and theme already installed and ~40 notes of demo content — unzip it and open the folder as a vault. |
| `nui-plugin-0.2.4.zip` | Only the plugin for managing the custom views |
| `nui-theme-0.2.4.zip` | Only the theme with custom typography and very minimalistic UI |

Every zip contains the same script `install.sh` and an `INSTALL.md` describing that
zip's payload.

## Commands and hotkeys

NUI adds thirteen commands. All of them are bindable under **Settings → Hotkeys**
— search for "NUI".

**Plugin default** is the opt-in binding registered when you turn it on under
**Settings → NUI → Hotkeys** (desktop only; reload required). **Example vault**
is what the bundled demo vault binds in `.obsidian/hotkeys.json` — NUI never
writes hotkeys into your vault. See [Start here](vault-example/Start%20here.md#hotkeys)
for the full Obsidian override list there too.

Eleven commands ship with no plugin default, so NUI takes nothing from you that
you did not ask for. Two carry an opt-in default — turn both on at once under
**Settings → NUI → Hotkeys → Turn all on**.

`Mod` is Cmd on macOS and Ctrl elsewhere.

| Command | Plugin default | Example vault | What it does | Needs |
| --- | --- | --- | --- | --- |
| Show or hide chrome | `Mod+Alt+` `` *(opt-in)* | `Mod+Alt+` `` | Hides the tab bar, sidebars, and view headers, then brings them back | — |
| Go to parent folder | `Mod+Escape` *(opt-in)* | `Mod+Escape` | Opens the hub note of the folder above the current one | Folder index |
| Open folder index | — | — | Opens the hub note for the folder in context | Folder index |
| Create folder index | — | — | Creates the hub note for the folder in context | Folder index |
| Turn note into folder | — | — | Converts the current note into a folder with the note as its hub | Folder index |
| Add cursor on line above | — | `Mod+Alt+↑` | Adds a cursor one line up | Multi-cursor commands |
| Add cursor on line below | — | `Mod+Alt+↓` | Adds a cursor one line down | Multi-cursor commands |
| Add next match to selections | — | `Mod+D` | Selects the next occurrence of the selection | Multi-cursor commands |
| Select all occurrences of find match | — | `Mod+Shift+L` | Selects every occurrence of the selection at once | Multi-cursor commands |
| Cursor to line ends | — | `Alt+Shift+I` | Adds a cursor at the end of each selected line | Multi-cursor commands |
| Copy line up | — | `Alt+Shift+↑` | Duplicates the current line above itself | Multi-cursor commands |
| Copy line down | — | `Alt+Shift+↓` | Duplicates the current line below itself | Multi-cursor commands |
| Set note text color | — | — | Sets a colour for the whole note | Text colour |

The **Needs** column names the setting under Settings → NUI that has to be on
for the command to be registered at all. *Multi-cursor commands* and *Text
colour* are on by default; *Folder index* is off, since it redefines what
clicking a folder does. The multi-cursor commands are desktop-only.

`Mod+Escape` stays inert while Folder index is off — the settings tab says so
rather than turning the feature on behind your back.

## Theme

Select **NUI** under Settings → Appearance → Themes.

The theme bundles no typefaces — blockquotes inherit the same text font as
body copy. Settings → Appearance → Font overrides all of it.

### Palette

Every hex value in the theme lives in `theme.css` §0. Everything below §0 uses
`var(--n-*)` and `var(--nui-*)` only.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--n-surface` | `#fdfdfd` | `#000` | flat workspace background |
| `--nui-content` | `#000` | `#aaa` | body copy, links, hover chrome |
| `--nui-chrome` | `#aaa` | `#445` | muted chrome labels and icons |
| `--n-border` | `#aaa` | `#445` | dividers, Bases borders |
| `--nui-timeline-grid` | `#aaa` | `#445` | timeline and tracker gridlines |

Accent colours follow Settings → Appearance → Accent color, via `--n-accent`
and `--nui-on-accent`. When editing, do light first, then invert the pair.

### Sections

Edit at the top: **§0** palette, **§1b** typography scale, **§1a** spacing
(`--nui-0` … `--nui-96`). Everything below is derived or layout.

| § | Contents |
| --- | --- |
| 0 | Color palette — edit hex values here only |
| 1a | Spacing scale |
| 1b | Typography scale — edit type values here only |
| 1c | Typography — element rules, derived from §1b |
| 2 | Token aliases — maps §0 to Obsidian's variables; do not edit |
| 3 | Workspace — flat surfaces |
| 4 | Workspace — muted chrome and native Bases UI |
| 4b | Properties — in-document metadata |
| 5 | Links |
| 6 | Tables |
| 7 | Embeds — images and note transclusion |
| 8 | Bases — table layout |
| 9 | Backlinks — simple list |
| 10 | NUI plugin views — inert without the plugin |

## Documentation

The canonical NUI specification lives in [docs/index.md](docs/index.md) — foundations, UI elements, and the Obsidian implementation (Bases views, vault conventions, behaviour). [references/](references/) holds OKF and LLM-wiki conventions. Plugin developers: read [plugin/CLAUDE.md](plugin/CLAUDE.md) for the build loop, then docs §3 for shipped behaviour.

## Repository layout

| Path | Role |
| --- | --- |
| `plugin/` | Plugin source, build, and tests. `plugin/src` is the source of truth. |
| `vault-example/` | The example vault, and the development vault. |
| `vault-example/.obsidian/themes/NUI/theme.css` | The theme. This file is the source of truth — there is no separate copy. |
| `scripts/` | Release packaging, the installer, and vault checks. |
| `docs/` | Product specification — design language, elements, Obsidian implementation notes. Start at [docs/index.md](docs/index.md). |
| `references/` | OKF and LLM-wiki conventions referenced by the spec. |
| `VERSION` | One version for the plugin, the theme, and the vault. |

## Development

```bash
cd plugin
npm install
npm run dev
```

`npm run dev` watches `plugin/src` and writes `main.js`, `manifest.json`, and
`styles.css` into `vault-example/.obsidian/plugins/nui/`, so opening `vault-example/` in
Obsidian shows the build. Those three files are gitignored; `data.json` beside
them is committed, because it is the example vault's demo configuration.
Override the target with `NUI_VAULT_PLUGIN_DIR`.

`npm run check` runs everything the release gate runs: typecheck, lint, tests,
and the personal-path and CSS-variable guards.

Development happens on `main`. **`vault-example/` is public and is the shipped
artifact, so every push to `main` publishes it.** Releases are cut by merging
`main` into `prod` and pushing; see [CHANGELOG.md](CHANGELOG.md).

## OKF knowledge refinery

OKF (Open Knowledge Format) support lives in a separate project:
[nui-okf](https://github.com/niklas-ekholm/nui-okf). Use it for triage,
ingestion, and multi-wiki OKF vaults. NUI stays focused on hub-note navigation,
Bases views, and the theme for life/project vaults.

## Licence

[MIT](LICENSE).
