
import { App, Notice, TFile, TFolder } from "obsidian";
import { resolveUniqueSubfolderName } from "../../navigation/create-subfolder";
import { withFolderIndexCreateSuppressed } from "../../navigation/folder-index-suppress";
import {
	hubNotePathForFolder,
	isHubNoteItem,
} from "../timeline/timeline-folder-grouping";
import { resolveUniqueNoteName } from "./create-note";
import {
	canMoveIntoProjectFolder,
	destinationFolderForMoveOut,
	isPathInsideProjectFolder,
} from "./project-folder-move-rules";

export { canMoveIntoProjectFolder } from "./project-folder-move-rules";

function joinFolderPath(folderPath: string, fileName: string): string {
	return folderPath ? `${folderPath}/${fileName}` : fileName;
}

export function isNoteInsideProjectFolder(app: App, filePath: string): boolean {
	return isPathInsideProjectFolder(filePath, (folderPath) => {
		const indexPath = hubNotePathForFolder(folderPath);
		return app.vault.getAbstractFileByPath(indexPath) instanceof TFile;
	});
}

async function moveFolderHubIntoProjectFolder(
	app: App,
	hubFile: TFile,
	targetFolderHubFile: TFile,
): Promise<boolean> {
	const sourceFolder = hubFile.parent;
	if (!(sourceFolder instanceof TFolder)) return false;

	const targetFolderPath = targetFolderHubFile.parent?.path ?? "";
	if (!targetFolderPath) return false;

	const folderName = resolveUniqueSubfolderName(
		app,
		targetFolderPath,
		sourceFolder.name,
	);
	const newFolderPath = joinFolderPath(targetFolderPath, folderName);

	try {
		await withFolderIndexCreateSuppressed(async () => {
			await app.fileManager.renameFile(sourceFolder, newFolderPath);
		});
		return true;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not move folder";
		new Notice(`Timeline: ${message}`);
		return false;
	}
}

async function moveFolderHubOutOfProjectFolder(
	app: App,
	hubFile: TFile,
): Promise<boolean> {
	const sourceFolder = hubFile.parent;
	if (!(sourceFolder instanceof TFolder)) return false;

	const destinationFolder = destinationFolderForMoveOut(hubFile.path);
	if (destinationFolder === undefined) return false;

	const folderName = resolveUniqueSubfolderName(
		app,
		destinationFolder,
		sourceFolder.name,
	);
	const newFolderPath = joinFolderPath(destinationFolder, folderName);

	try {
		await withFolderIndexCreateSuppressed(async () => {
			await app.fileManager.renameFile(sourceFolder, newFolderPath);
		});
		return true;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not move folder";
		new Notice(`Timeline: ${message}`);
		return false;
	}
}

export async function moveNotesIntoProjectFolder(
	app: App,
	files: TFile[],
	folderHubFile: TFile,
): Promise<number> {
	const targetFolder = folderHubFile.parent?.path ?? "";
	if (!targetFolder) return 0;

	let moved = 0;

	for (const file of files) {
		if (!canMoveIntoProjectFolder(file.path, folderHubFile.path)) {
			continue;
		}

		if (isHubNoteItem(file.path)) {
			if (await moveFolderHubIntoProjectFolder(app, file, folderHubFile)) {
				moved++;
			}
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

		if (isHubNoteItem(file.path)) {
			if (await moveFolderHubOutOfProjectFolder(app, file)) {
				moved++;
			}
			continue;
		}

		const destinationFolder = destinationFolderForMoveOut(file.path);
		if (destinationFolder === undefined) continue;

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
