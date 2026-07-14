
import { App } from "obsidian";

function joinFolderPath(folderPath: string, fileName: string): string {
	return folderPath ? `${folderPath}/${fileName}` : fileName;
}

export function resolveUniqueNoteName(
	app: App,
	folderPath: string,
	baseName = "Untitled",
): string {
	let candidate = `${baseName}.md`;
	let counter = 2;
	while (app.vault.getAbstractFileByPath(joinFolderPath(folderPath, candidate))) {
		candidate = `${baseName} ${counter}.md`;
		counter++;
	}
	return candidate;
}

export function buildDatedNoteContent(
	startKey: string,
	endKey: string,
	date: string,
): string {
	return `---\n${startKey}: ${date}\n${endKey}: ${date}\n---\n\n`;
}

