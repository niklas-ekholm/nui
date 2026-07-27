
import { App, Notice, TFile } from "obsidian";
import { parentFolderPathFromItemPath } from "../timeline/project-label";
import {
	isSuperprojectItem,
	superprojectPathForFolder,
} from "../timeline/superproject";
import { resolveUniqueNoteName } from "./create-note";

function joinFolderPath(folderPath: string, fileName: string): string {
	return folderPath ? `${folderPath}/${fileName}` : fileName;
}

export function isNoteInsideProjectFolder(app: App, filePath: string): boolean {
	if (isSuperprojectItem(filePath)) return false;

	const folder = parentFolderPathFromItemPath(filePath);
	if (!folder) return false;

	const indexPath = superprojectPathForFolder(folder);
	return app.vault.getAbstractFileByPath(indexPath) instanceof TFile;
}

export function canMoveIntoProjectFolder(
	sourcePath: string,
	targetSuperprojectPath: string,
): boolean {
	if (sourcePath === targetSuperprojectPath) return false;
	if (isSuperprojectItem(sourcePath)) return false;

	const targetFolder = parentFolderPathFromItemPath(targetSuperprojectPath);
	if (!targetFolder) return false;

	const sourceFolder = parentFolderPathFromItemPath(sourcePath);
	if (sourceFolder === targetFolder) return false;

	return true;
}

export async function moveNotesIntoProjectFolder(
	app: App,
	files: TFile[],
	superprojectFile: TFile,
): Promise<number> {
	const targetFolder = superprojectFile.parent?.path ?? "";
	if (!targetFolder) return 0;

	let moved = 0;

	for (const file of files) {
		if (!canMoveIntoProjectFolder(file.path, superprojectFile.path)) {
			continue;
		}

		const fileName = resolveUniqueNoteName(app, targetFolder, file.basename);
		const newPath = joinFolderPath(targetFolder, fileName);

		try {
			await app.fileManager.renameFile(file, newPath);
			moved++;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Could not move note";
			new Notice(`Timeline: ${message}`);
		}
	}

	return moved;
}

export async function moveNotesOutOfProjectFolder(
	app: App,
	files: TFile[],
): Promise<number> {
	let moved = 0;

	for (const file of files) {
		if (!isNoteInsideProjectFolder(app, file.path)) continue;

		const projectFolder = file.parent?.path ?? "";
		const destinationFolder = parentFolderPathFromItemPath(projectFolder);
		const fileName = resolveUniqueNoteName(app, destinationFolder, file.basename);
		const newPath = joinFolderPath(destinationFolder, fileName);

		try {
			await app.fileManager.renameFile(file, newPath);
			moved++;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Could not move note";
			new Notice(`Timeline: ${message}`);
		}
	}

	return moved;
}
