export function isComplexValue(
	value: unknown,
): value is Record<string, unknown> | unknown[] {
	return value !== null && typeof value === "object";
}

export function getNestedValue(
	root: Record<string, unknown>,
	path: string[],
): unknown {
	let current: unknown = root;
	for (const segment of path) {
		if (current === null || typeof current !== "object") {
			return undefined;
		}
		if (Array.isArray(current)) {
			const index = Number(segment);
			if (!Number.isInteger(index)) {
				return undefined;
			}
			current = current[index];
			continue;
		}
		current = (current as Record<string, unknown>)[segment];
	}
	return current;
}
