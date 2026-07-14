
import * as fs from "fs";
import * as path from "path";
import { App, Notice, TFile, TFolder } from "obsidian";
import { parseFrontmatter } from "../core/parse/frontmatter";

export interface ImportResult {
	copied: number;
}

export interface ImportOptions {
	onlyPublishMarked: boolean;
}

function isPublishMarked(frontmatter: Record<string, unknown>): boolean {
	const value = frontmatter.publish;
	return value === true || value === "true";
}

function collectFilesystemMarkdown(
	sourceFolderPath: string,
): { relativePath: string; absolutePath: string }[] {
	if (!fs.existsSync(sourceFolderPath)) {
		return [];
	}

	const results: { relativePath: string; absolutePath: string }[] = [];

	const walk = (currentPath: string, relativePrefix: string) => {
		for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				walk(
					path.join(currentPath, entry.name),
					`${relativePrefix}${entry.name}/`,
				);
				continue;
			}

			if (entry.isFile() && entry.name.endsWith(".md")) {
				results.push({
					relativePath: `${relativePrefix}${entry.name}`,
					absolutePath: path.join(currentPath, entry.name),
				});
			}
		}
	};

	walk(sourceFolderPath, "");
	return results;
}

function collectImportableFiles(
	sourceFolderPath: string,
	options: ImportOptions,
): { relativePath: string; absolutePath: string }[] {
	const candidates = collectFilesystemMarkdown(sourceFolderPath);

	if (!options.onlyPublishMarked) {
		return candidates;
	}

	return candidates.filter((candidate) => {
		const content = fs.readFileSync(candidate.absolutePath, "utf8");
		const { frontmatter } = parseFrontmatter(content);
		return isPublishMarked(frontmatter);
	});
}

function joinVaultPath(folderPath: string, relativePath: string): string {
	const normalizedFolder = folderPath.replace(/^\/+|\/+$/g, "");
	const normalizedRelative = relativePath.replace(/^\/+/, "").replace(/\\/g, "/");
	return normalizedFolder
		? `${normalizedFolder}/${normalizedRelative}`
		: normalizedRelative;
}

async function ensureVaultFolder(app: App, folderPath: string): Promise<void> {
	if (!folderPath) {
		return;
	}

	const existing = app.vault.getAbstractFileByPath(folderPath);
	if (existing instanceof TFolder) {
		return;
	}

	await app.vault.createFolder(folderPath);
}

async function replaceVaultFolderContents(
	app: App,
	destinationFolderPath: string,
): Promise<void> {
	const folder = app.vault.getAbstractFileByPath(destinationFolderPath);
	if (folder instanceof TFolder) {
		await app.vault.delete(folder, true);
	}

	await app.vault.createFolder(destinationFolderPath);
}

export async function importFolderToDestination(
	app: App,
	sourceFolderPath: string,
	destinationFolderPath: string,
	options: ImportOptions,
): Promise<ImportResult> {
	if (!fs.existsSync(sourceFolderPath) || !fs.statSync(sourceFolderPath).isDirectory()) {
		throw new Error(`Folder not found: "${sourceFolderPath}".`);
	}

	const importable = collectImportableFiles(sourceFolderPath, options);

	await replaceVaultFolderContents(app, destinationFolderPath);

	if (importable.length === 0) {
		return { copied: 0 };
	}

	for (const { relativePath, absolutePath } of importable) {
		const vaultPath = joinVaultPath(destinationFolderPath, relativePath);
		const parentPath = vaultPath.split("/").slice(0, -1).join("/");
		await ensureVaultFolder(app, parentPath);

		const content = fs.readFileSync(absolutePath, "utf8");
		const existing = app.vault.getAbstractFileByPath(vaultPath);
		if (existing instanceof TFile) {
			await app.vault.modify(existing, content);
		} else {
			await app.vault.create(vaultPath, content);
		}
	}

	return { copied: importable.length };
}

export async function runImportFolder(
	app: App,
	sourceFolderPath: string,
	destinationFolderPath: string,
	options: ImportOptions,
): Promise<void> {
	try {
		const result = await importFolderToDestination(
			app,
			sourceFolderPath,
			destinationFolderPath,
			options,
		);
		new Notice(
			result.copied === 0
				? options.onlyPublishMarked
					? "No files with publish: true found."
					: "No markdown files found."
				: result.copied === 1
					? "Imported 1 file."
					: `Imported ${result.copied} files.`,
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not import folder.";
		new Notice(message);
	}
}
