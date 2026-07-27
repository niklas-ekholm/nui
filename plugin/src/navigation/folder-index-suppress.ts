/** Nested-safe suppress for `FolderIndexManager` vault create auto-hub. */

let suppressDepth = 0;

export function beginSuppressFolderIndexCreate(): void {
	suppressDepth++;
}

export function endSuppressFolderIndexCreate(): void {
	suppressDepth = Math.max(0, suppressDepth - 1);
}

export function isFolderIndexCreateSuppressed(): boolean {
	return suppressDepth > 0;
}

export async function withFolderIndexCreateSuppressed<T>(
	fn: () => Promise<T>,
): Promise<T> {
	beginSuppressFolderIndexCreate();
	try {
		return await fn();
	} finally {
		endSuppressFolderIndexCreate();
	}
}
