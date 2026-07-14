
import { App, Modal, Setting } from "obsidian";

export function confirmMoveToBin(
	app: App,
	message: string,
	onConfirm: () => void | Promise<void>,
): void {
	const modal = new MoveToBinModal(app, message, onConfirm);
	modal.open();
}

class MoveToBinModal extends Modal {
	constructor(
		app: App,
		private message: string,
		private onConfirm: () => void | Promise<void>,
	) {
		super(app);
	}

	onOpen(): void {
		this.setTitle("Move to Bin");
		this.contentEl.createEl("p", { text: this.message });

		new Setting(this.contentEl).addButton((btn) => {
			btn.setButtonText("Move to Bin");
			btn.setWarning();
			btn.onClick(async () => {
				await this.onConfirm();
				this.close();
			});
		});

		new Setting(this.contentEl).addButton((btn) => {
			btn.setButtonText("Cancel");
			btn.onClick(() => {
				this.close();
			});
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
