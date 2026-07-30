
Every base lives here, and none of them names a folder. Most filter on

```
file.inFolder(this.file.folder)
```

which means **the folder of the note it is embedded in, and everything below it**. One base file, embedded wherever you want that view, scoped by where you put it. Embed `Timeline.base` in a project's note and you get that project; embed it in a note at the vault root and you get the whole vault.

**Timeline** and **Tracker** include the note they are embedded in and all its siblings in the same folder. The other bases exclude the host note itself.

That is also why opening one of these from this folder shows nothing (or nearly nothing for Timeline/Tracker): `Bases` is its own scope, and it has no dated projects or habit completions. They are meant to be embedded, not opened.

| Base | Scope | Embedded in |
| --- | --- | --- |
| [[Navigation.base]] | Folder + below, excl. self | [[Start here]], [[Daily]] |
| [[Timeline.base]] | Folder only, incl. self | [[Projects]], [[Bunker library]] |
| [[Tasks.base]] | Folder + below, excl. self | [[Projects]] |
| [[Tracker.base]] | Folder only, incl. self | [[Habits]], [[Reading]], [[Running]] |
| [[Scores.base]] | Folder + below, excl. self | [[Running]] |
| [[ImageGallery.base]] | Folder + below, excl. self — image files (`file.ext`) | [[Tulsa motel — scene photos]] |
| [[NoteGallery.base]] | Folder + below, excl. self — all notes; cards show `coverimage` when set. **#folder** view is siblings only | [[Sam's personal notes]] |

Three views ignore the query and read the host folder directly, so they follow the embed rather than the filter: **List: Navigation** and **List: Folders** walk out from the folder they are rendered in, and **Week Tracker: 3** takes its rows from that folder's subfolders.
