
import { App, TFile } from "obsidian";
import { resolveUniqueNoteName } from "./create-note";

function joinFolderPath(folderPath: string, fileName: string): string {
	return folderPath ? `${folderPath}/${fileName}` : fileName;
}

export async function duplicateNote(app: App, file: TFile): Promise<TFile> {
	const folder = file.parent?.path ?? "";
	const fileName = resolveUniqueNoteName(app, folder, `${file.basename} copy`);
	const filePath = joinFolderPath(folder, fileName);
	const content = await app.vault.read(file);
	return app.vault.create(filePath, content);
}
