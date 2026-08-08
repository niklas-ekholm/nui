import * as path from "path";

export interface IndexedNote {
	uriFsPath: string;
	workspaceRoot: string;
	relativePath: string;
}

export interface NoteIndexSnapshot {
	byName: ReadonlyMap<string, readonly IndexedNote[]>;
	byPath: ReadonlyMap<string, IndexedNote>;
}

export function normalizeKey(value: string): string {
	return value.toLowerCase();
}

export function slugifyHeading(heading: string): string {
	return heading
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.replace(/\s+/g, "-");
}

export function toRelativeHref(
	sourceFsPath: string,
	targetFsPath: string,
	heading?: string,
): string {
	const rel = path.relative(path.dirname(sourceFsPath), targetFsPath);
	let href = rel.split(path.sep).join("/");
	if (!href.startsWith(".") && !href.startsWith("/")) {
		href = `./${href}`;
	}
	if (heading) {
		href += `#${slugifyHeading(heading)}`;
	}
	return href;
}

const PATH_ALIASES = ["docs/", "vault-example/"];

export function toPreviewHref(
	note: IndexedNote,
	sourceFsPath: string | undefined,
	heading?: string,
): string {
	if (sourceFsPath) {
		return toRelativeHref(sourceFsPath, note.uriFsPath, heading);
	}

	let href = `/${note.relativePath}.md`;
	if (heading) {
		href += `#${slugifyHeading(heading)}`;
	}
	return href;
}

export function toUnresolvedHref(
	target: string,
	heading?: string,
): string {
	const href =
		target.includes("/") ? `/docs/${target}.md` : `./${target}.md`;

	if (heading) {
		return `${href}#${slugifyHeading(heading)}`;
	}
	return href;
}

function pickBestMatch(
	candidates: readonly IndexedNote[],
	sourceFsPath: string | undefined,
): IndexedNote {
	if (candidates.length === 1) {
		return candidates[0];
	}

	if (!sourceFsPath) {
		return [...candidates].sort(
			(a, b) => a.relativePath.length - b.relativePath.length,
		)[0];
	}

	const sourceDir = path.dirname(sourceFsPath);
	const sourceFolder = candidates.find(
		(c) => sourceFsPath.startsWith(c.workspaceRoot + path.sep),
	)?.workspaceRoot;

	return [...candidates].sort((a, b) => {
		let scoreA = 0;
		let scoreB = 0;

		if (sourceFolder) {
			if (a.workspaceRoot === sourceFolder) scoreA += 100;
			if (b.workspaceRoot === sourceFolder) scoreB += 100;
		}

		if (path.dirname(a.uriFsPath) === sourceDir) scoreA += 50;
		if (path.dirname(b.uriFsPath) === sourceDir) scoreB += 50;

		scoreA -= a.relativePath.length;
		scoreB -= b.relativePath.length;

		return scoreB - scoreA;
	})[0];
}

export function resolveWikilinkTarget(
	target: string,
	index: NoteIndexSnapshot,
	sourceFsPath: string | undefined,
): IndexedNote | undefined {
	const key = normalizeKey(target);

	if (target.includes("/")) {
		const byPath = index.byPath.get(key);
		if (byPath) {
			return byPath;
		}
		return index.byPath.get(normalizeKey(`${target}/index`));
	}

	const matches = index.byName.get(key);
	if (!matches?.length) {
		return undefined;
	}

	return pickBestMatch(matches, sourceFsPath);
}

export interface ResolvedWikilinkHref {
	href: string;
	dataHref: string;
	resolved: boolean;
}

export function resolveWikilinkHref(
	target: string,
	heading: string | undefined,
	index: NoteIndexSnapshot,
	sourceFsPath: string | undefined,
): ResolvedWikilinkHref {
	const note = resolveWikilinkTarget(target, index, sourceFsPath);
	if (note) {
		const href = toPreviewHref(note, sourceFsPath, heading);
		return { href, dataHref: href, resolved: true };
	}

	const href = toUnresolvedHref(target, heading);
	return { href, dataHref: href, resolved: false };
}

export function buildNoteIndexSnapshot(
	entries: Array<{ uriFsPath: string; workspaceRoot: string }>,
): NoteIndexSnapshot {
	const byName = new Map<string, IndexedNote[]>();
	const byPath = new Map<string, IndexedNote>();

	for (const entry of entries) {
		const rel = path.relative(entry.workspaceRoot, entry.uriFsPath);
		const relativePath = rel.split(path.sep).join("/").replace(/\.md$/i, "");
		const note: IndexedNote = {
			uriFsPath: entry.uriFsPath,
			workspaceRoot: entry.workspaceRoot,
			relativePath,
		};

		byPath.set(normalizeKey(relativePath), note);
		for (const prefix of PATH_ALIASES) {
			if (relativePath.startsWith(prefix)) {
				byPath.set(normalizeKey(relativePath.slice(prefix.length)), note);
			}
		}

		const basename = path.basename(entry.uriFsPath, ".md");
		if (basename === "index") {
			const folderName = path.basename(path.dirname(entry.uriFsPath));
			addByName(byName, folderName, note);
		}
		addByName(byName, basename, note);
	}

	return { byName, byPath };
}

function addByName(
	map: Map<string, IndexedNote[]>,
	name: string,
	note: IndexedNote,
): void {
	const key = normalizeKey(name);
	const existing = map.get(key);
	if (existing) {
		existing.push(note);
		return;
	}
	map.set(key, [note]);
}
