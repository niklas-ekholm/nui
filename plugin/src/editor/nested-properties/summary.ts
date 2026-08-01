import { isComplexValue } from "./nested-value";

export function formatSummary(value: unknown): string {
	if (value === null || value === undefined) {
		return "empty";
	}
	if (Array.isArray(value)) {
		return value.length === 1
			? "1 item"
			: `${value.length} items`;
	}
	if (typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>);
		if (entries.length === 0) {
			return "empty";
		}
		if (entries.length <= 2) {
			return entries
				.map(([key, val]) => {
					if (isComplexValue(val)) {
						return key;
					}
					return `${key}: ${String(val)}`;
				})
				.join(" · ");
		}
		return `${entries.length} keys`;
	}
	return String(value);
}
