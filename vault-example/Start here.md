
This vault exists to show what the NUI plugin and theme do. Every note in it is invented. Poke at anything.

> [!info] The settings used here are not on by default. If you install NUI into a vault of your own, you need to turn on the features in NUI plugin settings.


## Where to look first

Open the **note**, not the base. Every base in [[Bases]] filters on `file.inFolder(this.file.folder)` — the folder of the note it is embedded in, and everything below. So the same `Timeline.base` shows all your projects from one note and a single project from another. Opened on its own from `Bases`, it scopes to `Bases`, which holds nothing, and comes up empty.

| Open this | To see |
| --- | --- |
| [[Projects]] | Every project as a bar on a date axis, three layouts, plus the task lists |
| [[Bunker library]] | The same timeline embed, one folder down: that project's three phases and nothing else |
| [[Habits]] | Three-week, year, and month trackers across Reading, Running and Writing |
| [[Running]] | One habit's distances as a line chart and as bars, and the trackers narrowed to it |
| [[Sam's personal notes]] | Text formatting, tables, cover images, and NoteGallery / ImageGallery |
| [[Daily]] | Files grouped by date, and `Daily.base` links for today / yesterday / tomorrow |

Between them those cover all fourteen views the plugin adds. Each embed has a view picker in its top-right corner — most hold more than one view.

Because folder-index is on, clicking any of those folders in the sidebar opens the note above. The whole vault at once looks like this:

![[Daily.base#today]]

![[Navigation.base]]

## The conventions this vault uses

These are the parts you would have to match in your own vault for the views to find anything.

**Dates** live in a `date` property, `YYYY-MM-DD`. A view can be pointed at a different property, and falls back to an ISO date at the start of the filename.

**Habits are folders.** `Habits/` holds one folder per habit — Reading, Running, Writing — and each dated note inside a habit folder is one completion. A `rating` from 1 to 5 shades the cell. Three of the fourteen views ignore the query and read the host folder directly: **Week Tracker: 3** takes its rows from the subfolders of wherever it is embedded, which is why the same `Tracker.base` shows three habits from [[Habits]] and one from [[Running]]. **List: Navigation** and **List: Folders** walk out from the host folder the same way.

**Projects** carry `start`, `end`, and `project`. The timeline groups bars by `project`, so `Apocalypse` gathers four notes under one heading and `Bunker` gathers two. The phases under [[Bunker library]] carry no `project` at all, which is what an ungrouped bar looks like. Checkbox lines in the note body feed the task views. Filter by person with `responsibility` — see [[Dean Responsibilities]] and [[Sam Responsibilities]].

**Cover images** go in a `coverimage` property as a link — `"[[djinn-research-cover.png]]"`. Use a wide crop (this vault uses 3.5:1) for note banners and card grids; pick a landscape or location still, not a portrait. Store the image beside the note (`attachmentFolderPath` is `./`). **ImageGallery.base** embeds list image files from the base query (PNG, JPEG, and the like). **NoteGallery.base** embeds show note cards in the folder and below — use **#folder** for siblings only. See [[Sam's personal notes]] and [[Tulsa motel — scene photos]].

**Scores** are a `score` number. The chart in `Scores.base` reads the distance recorded on each run.

## Hotkeys

This vault ships a `.obsidian/hotkeys.json`, so the keys below are already bound
here. They are **not** installed into your own vault — nothing NUI ships ever
writes your hotkeys. Rebind or clear any of them under Settings → Hotkeys.

The [root README](../README.md#commands-and-hotkeys) tabulates the same NUI
bindings with plugin opt-in defaults. **Plugin default** and **Example vault**
columns match for every command listed below.

`Mod` is Cmd on macOS and Ctrl elsewhere.

### NUI commands

| Key | Command |
| --- | --- |
| `Mod+Alt+` `` | Show or hide chrome |
| `Mod+Escape` | Go to parent folder |
| `Mod+Alt+↑` / `Mod+Alt+↓` | Add cursor on line above / below |
| `Mod+D` | Add next match to selections |
| `Mod+Shift+L` | Select all occurrences of find match |
| `Alt+Shift+I` | Cursor to line ends |
| `Alt+Shift+↑` / `Alt+Shift+↓` | Copy line up / down |

Four NUI commands have no binding in this vault — **Open folder index**,
**Create folder index**, **Turn note into folder**, and **Set note text color**.
Bind them yourself under Settings → Hotkeys; search for "NUI".

### Rebound Obsidian defaults

The two worth knowing about first, because they are swapped from stock:

| Key | Command | Obsidian's default |
| --- | --- | --- |
| `Mod+P` | Quick switcher | `Mod+O` |
| `Mod+Shift+P` | Command palette | `Mod+P` |

The rest:

| Key | Command |
| --- | --- |
| `Mod+Enter` | Follow link |
| `Mod+Alt+0` … `Mod+Alt+6` | Set heading level 0–6 |
| `Mod+Shift+7` / `8` / `9` | Numbered list / bullet list / checklist |
| `Mod+Shift+0` | Clear formatting |
| `Mod+Shift+C` | Toggle code |
| `Mod+` `` | Toggle source mode |
| `Alt+↑` / `Alt+↓` | Move line up / down |
| `Ctrl+Alt+↑` / `Ctrl+Alt+↓` | Fold all / unfold all |
| `Mod+Shift+Backspace` | Delete paragraph |
| `Mod+Shift+E` | Toggle left sidebar |
| `Mod+Alt+B` | Toggle right sidebar |
| `Mod+Alt+E` | Toggle ribbon |
| `Mod+=` / `Mod+-` | Zoom in / out |
| `Mod+Shift+N` | New window |

Four defaults are deliberately cleared rather than rebound: open link in new pane, go forward, new file in new pane, and add metadata property.

## What is missing on purpose

There is no `workspace.json`, so Obsidian opens with its own default layout rather than one saved on someone else's monitor. Set the panes up however you like — the vault will remember it from then on, and git ignores it.
