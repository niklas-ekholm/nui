
import { App, Notice, TFile } from "obsidian";
import { getFolderIndexPath } from "./folder-index";

export function resolveUniqueSubfolderName(
	app: App,
	parentFolderPath: string,
	baseName = "Untitled",
): string {
	let candidate = baseName;
	let counter = 2;
	while (app.vault.getAbstractFileByPath(joinFolderPath(parentFolderPath, candidate))) {
		candidate = `${baseName} ${counter}`;
		counter++;
	}
	return candidate;
}

export async function createSubfolder(
	app: App,
	parentFolderPath: string,
	folderName: string,
): Promise<TFile | null> {
	const trimmed = folderName.trim();
	if (!trimmed) {
		new Notice("Folder name cannot be empty.");
		return null;
	}
	if (trimmed.includes("/") || trimmed.includes("\\")) {
		new Notice("Folder name cannot contain slashes.");
		return null;
	}

	const folderPath = joinFolderPath(parentFolderPath, trimmed);
	if (app.vault.getAbstractFileByPath(folderPath)) {
		new Notice(`Folder already exists: "${trimmed}".`);
		return null;
	}

	try {
		const folder = await app.vault.createFolder(folderPath);
		const indexPath = getFolderIndexPath(folder);
		return await app.vault.create(indexPath, "");
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not create folder";
		new Notice(`New folder: ${message}`);
		return null;
	}
}

export async function createUntitledSubfolder(
	app: App,
	parentFolderPath: string,
): Promise<TFile | null> {
	const folderName = resolveUniqueSubfolderName(app, parentFolderPath);
	return createSubfolder(app, parentFolderPath, folderName);
}

function joinFolderPath(parentFolderPath: string, folderName: string): string {
	return parentFolderPath ? `${parentFolderPath}/${folderName}` : folderName;
}

