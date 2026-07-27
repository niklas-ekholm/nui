Every base lives here, and none of them names a folder. Each one filters on

```
file.inFolder(this.file.folder)
```

which means **the folder of the note it is embedded in, and everything below
it**. One base file, embedded wherever you want that view, scoped by where you
put it. Embed `Timeline.base` in a project's note and you get that project;
embed it in a note at the vault root and you get the whole vault.

That is also why opening one of these from this folder shows nothing: `Bases` is
its own scope, and there are no dated notes in it. They are meant to be
embedded, not opened.

| Base | Views | Embedded in |
| --- | --- | --- |
| [[Contents.base]] | Navigation, Folders, Recent, By date, Today | [[Start here]], [[Daily]] |
| [[Timeline.base]] | Timeline, With tasks, Compact | [[Projects]], [[Kettle shelf]] |
| [[Tasks.base]] | Open, All | [[Projects]] |
| [[Tracker.base]] | Three weeks, Year, Month | [[Habits]], [[Reading]], [[Running]] |
| [[Scores.base]] | Line, Bars | [[Running]] |
| [[Gallery.base]] | Picture Gallery, Card L, Card S | [[Library]] |

Two views ignore the query and read the host folder directly, so they follow the
embed rather than the filter: **List: Navigation** and **List: Folders** walk
out from the folder they are rendered in, and **Week Tracker: 3** takes its rows
from that folder's subfolders.
