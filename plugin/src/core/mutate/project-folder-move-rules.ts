
import { isFolderIndexPath } from "../../navigation/folder-index-path.ts";

function parentFolderPathFromItemPath(filePath: string): string {
	const slash = filePath.lastIndexOf("/");
	return slash <= 0 ? "" : filePath.slice(0, slash);
}

function parentFolderPath(folderPath: string): string {
	const slash = folderPath.lastIndexOf("/");
	return slash <= 0 ? "" : folderPath.slice(0, slash);
}

function folderPathForHubNote(hubNotePath: string): string {
	return parentFolderPathFromItemPath(hubNotePath);
}

function isFolderPathInside(folderPath: string, ancestorPath: string): boolean {
	if (!ancestorPath) return false;
	return (
		folderPath === ancestorPath || folderPath.startsWith(`${ancestorPath}/`)
	);
}

export function canMoveIntoProjectFolder(
	sourcePath: string,
	targetFolderHubPath: string,
): boolean {
	if (sourcePath === targetFolderHubPath) return false;

	const targetFolder = folderPathForHubNote(targetFolderHubPath);
	if (!targetFolder) return false;

	if (isFolderIndexPath(sourcePath)) {
		const sourceFolder = folderPathForHubNote(sourcePath);
		if (!sourceFolder) return false;
		if (isFolderPathInside(targetFolder, sourceFolder)) return false;
		if (parentFolderPath(sourceFolder) === targetFolder) return false;
		return true;
	}

	const sourceFolder = parentFolderPathFromItemPath(sourcePath);
	if (sourceFolder === targetFolder) return false;

	return true;
}

export function isPathInsideProjectFolder(
	filePath: string,
	hasHubNoteAtFolder: (folderPath: string) => boolean,
): boolean {
	if (isFolderIndexPath(filePath)) {
		const folderPath = folderPathForHubNote(filePath);
		const parentFolder = parentFolderPath(folderPath);
		if (!parentFolder) return false;
		return hasHubNoteAtFolder(parentFolder);
	}

	const folder = parentFolderPathFromItemPath(filePath);
	if (!folder) return false;

	return hasHubNoteAtFolder(folder);
}

export function destinationFolderForMoveOut(filePath: string): string | undefined {
	if (isFolderIndexPath(filePath)) {
		const folderPath = folderPathForHubNote(filePath);
		const parentProjectFolder = parentFolderPath(folderPath);
		if (!parentProjectFolder) return undefined;
		return parentFolderPath(parentProjectFolder);
	}

	const projectFolder = parentFolderPathFromItemPath(filePath);
	if (!projectFolder) return undefined;

	return parentFolderPath(projectFolder);
}
