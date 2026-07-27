
import {
	App,
	BasesEntry,
	BasesPropertyId,
	NullValue,
	StringValue,
	TFile,
	Value,
} from "obsidian";

export function fileAsEntry(app: App, path: string, basename: string): BasesEntry {
	const existing = app.vault.getFileByPath(path);
	const file =
		existing instanceof TFile
			? existing
			: ({
					path,
					basename,
					name: `${basename}.md`,
					extension: "md",
				} as TFile);

	return {
		file,
		getValue(propertyId: BasesPropertyId): Value | null {
			if (propertyId === "file.name") {
				return new StringValue(file.name);
			}
			return new NullValue();
		},
	} as BasesEntry;
}

