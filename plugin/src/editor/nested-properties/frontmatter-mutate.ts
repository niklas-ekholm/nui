import { App, TFile } from "obsidian";
import { getNestedValue } from "./nested-value";

export { getNestedValue, isComplexValue } from "./nested-value";

export async function setNestedValue(
	app: App,
	file: TFile,
	path: string[],
	value: unknown,
): Promise<void> {
	if (path.length === 0) {
		return;
	}
	await app.fileManager.processFrontMatter(file, (frontmatter) => {
		const root = frontmatter as Record<string, unknown>;
		let current: Record<string, unknown> | unknown[] = root;
		for (let i = 0; i < path.length - 1; i++) {
			const segment = path[i];
			const next = getNestedValue(root, path.slice(0, i + 1));
			if (next === undefined) {
				const created: Record<string, unknown> = {};
				if (Array.isArray(current)) {
					const index = Number(segment);
					current[index] = created;
					current = created;
				} else {
					(current as Record<string, unknown>)[segment] = created;
					current = created;
				}
				continue;
			}
			if (Array.isArray(next)) {
				current = next;
			} else {
				current = next as Record<string, unknown>;
			}
		}
		const last = path[path.length - 1];
		if (Array.isArray(current)) {
			current[Number(last)] = value;
		} else {
			current[last] = value;
		}
	});
}
