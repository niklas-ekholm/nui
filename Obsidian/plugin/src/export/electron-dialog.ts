
import { FileSystemAdapter } from "obsidian";

type ElectronDialog = {
	showOpenDialog(options: {
		title?: string;
		defaultPath?: string;
		buttonLabel?: string;
		properties?: string[];
	}): Promise<{ canceled: boolean; filePaths: string[] }>;
};

function getElectronDialog(): ElectronDialog | null {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const remote = require("@electron/remote");
		if (remote?.dialog) {
			return remote.dialog;
		}
	} catch {
		// fall through
	}

	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const electron = require("electron");
		if (electron?.remote?.dialog) {
			return electron.remote.dialog;
		}
		if (electron?.dialog) {
			return electron.dialog;
		}
	} catch {
		// fall through
	}

	return null;
}

export async function pickFolder(options: {
	title: string;
	defaultPath?: string;
	buttonLabel?: string;
}): Promise<string | null> {
	const dialog = getElectronDialog();
	if (!dialog) {
		return null;
	}

	const result = await dialog.showOpenDialog({
		title: options.title,
		defaultPath: options.defaultPath,
		buttonLabel: options.buttonLabel ?? "Choose folder",
		properties: ["openDirectory", "createDirectory"],
	});

	if (result.canceled || result.filePaths.length === 0) {
		return null;
	}

	return result.filePaths[0] ?? null;
}

export function getVaultBasePath(adapter: unknown): string | null {
	if (!(adapter instanceof FileSystemAdapter)) {
		return null;
	}

	return adapter.getBasePath();
}
