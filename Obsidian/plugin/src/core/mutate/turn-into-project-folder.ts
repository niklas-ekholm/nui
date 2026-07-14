
import { App, Notice, TFile } from "obsidian";
import { resolveUniqueSubfolderName } from "../../navigation/create-subfolder";
import { isFolderIndexPath } from "../../navigation/folder-index";

function joinFolderPath(parentFolderPath: string, folderName: string): string {
	return parentFolderPath ? `${parentFolderPath}/${folderName}` : folderName;
}

export async function turnIntoProjectFolder(
	app: App,
	file: TFile,
): Promise<TFile | null> {
	if (isFolderIndexPath(file.path)) {
		new Notice("Note is already a folder index.");
		return null;
	}

	const parentFolderPath = file.parent?.path ?? "";
	const folderName = resolveUniqueSubfolderName(
		app,
		parentFolderPath,
		file.basename,
	);
	const folderPath = joinFolderPath(parentFolderPath, folderName);
	const indexPath = joinFolderPath(folderPath, `${folderName}.md`);

	try {
		await app.vault.createFolder(folderPath);
		await app.fileManager.renameFile(file, indexPath);
		const indexFile = app.vault.getAbstractFileByPath(indexPath);
		return indexFile instanceof TFile ? indexFile : null;
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Could not create project folder";
		new Notice(message);
		return null;
	}
}
