
import * as fs from "fs";
import * as path from "path";
import { App, Notice, TFile, TFolder } from "obsidian";
import { parseFrontmatter } from "../core/parse/frontmatter";

export interface ExportResult {
	copied: number;
}

export interface ExportOptions {
	onlyPublishMarked: boolean;
}

function isPublishMarked(frontmatter: Record<string, unknown>): boolean {
	const value = frontmatter.publish;
	return value === true || value === "true";
}

async function collectExportableFiles(
	app: App,
	sourceFolderPath: string,
	options: ExportOptions,
): Promise<{ relativePath: string; file: TFile }[]> {
	const folder = app.vault.getAbstractFileByPath(sourceFolderPath);
	if (!(folder instanceof TFolder)) {
		return [];
	}

	const candidates: { relativePath: string; file: TFile }[] = [];

	const walk = (current: TFolder, relativePrefix: string) => {
		for (const child of current.children) {
			if (child instanceof TFolder) {
				walk(child, `${relativePrefix}${child.name}/`);
				continue;
			}

			if (child instanceof TFile && child.extension === "md") {
				candidates.push({
					relativePath: `${relativePrefix}${child.name}`,
					file: child,
				});
			}
		}
	};

	walk(folder, "");

	if (!options.onlyPublishMarked) {
		return candidates;
	}

	const filtered: { relativePath: string; file: TFile }[] = [];

	for (const candidate of candidates) {
		const content = await app.vault.read(candidate.file);
		const { frontmatter } = parseFrontmatter(content);
		if (isPublishMarked(frontmatter)) {
			filtered.push(candidate);
		}
	}

	return filtered;
}

export async function exportFolderToDestination(
	app: App,
	sourceFolderPath: string,
	destinationPath: string,
	options: ExportOptions,
): Promise<ExportResult> {
	const folder = app.vault.getAbstractFileByPath(sourceFolderPath);
	if (!(folder instanceof TFolder)) {
		throw new Error(`Folder not found: "${sourceFolderPath}".`);
	}

	const exportable = await collectExportableFiles(
		app,
		sourceFolderPath,
		options,
	);

	if (exportable.length === 0) {
		if (fs.existsSync(destinationPath)) {
			fs.rmSync(destinationPath, { recursive: true, force: true });
		}
		fs.mkdirSync(destinationPath, { recursive: true });
		return { copied: 0 };
	}

	if (fs.existsSync(destinationPath)) {
		fs.rmSync(destinationPath, { recursive: true, force: true });
	}
	fs.mkdirSync(destinationPath, { recursive: true });

	for (const { relativePath, file } of exportable) {
		const destinationFile = path.join(destinationPath, relativePath);
		fs.mkdirSync(path.dirname(destinationFile), { recursive: true });
		const content = await app.vault.read(file);
		fs.writeFileSync(destinationFile, content, "utf8");
	}

	return { copied: exportable.length };
}

export async function runExportFolder(
	app: App,
	sourceFolderPath: string,
	destinationPath: string,
	options: ExportOptions,
): Promise<void> {
	try {
		const result = await exportFolderToDestination(
			app,
			sourceFolderPath,
			destinationPath,
			options,
		);
		new Notice(
			result.copied === 0
				? options.onlyPublishMarked
					? "No files with publish: true found."
					: "No markdown files found."
				: result.copied === 1
					? "Exported 1 file."
					: `Exported ${result.copied} files.`,
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not export folder.";
		new Notice(message);
	}
}
