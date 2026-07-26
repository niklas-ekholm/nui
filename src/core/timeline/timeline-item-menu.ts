
import { Menu } from "obsidian";

export interface TimelineItemMenuOptions {
	onDelete: () => void;
	onDuplicate: () => void;
	onRename?: () => void;
	onSetColor?: () => void;
	onTurnIntoProjectFolder?: () => void;
	onMoveOutOfProjectFolder?: () => void;
}

export function showTimelineItemMenu(
	event: MouseEvent,
	options: TimelineItemMenuOptions,
): void {
	event.preventDefault();
	event.stopPropagation();

	const menu = new Menu();

	menu.addItem((item) => {
		item.setTitle("Move to Bin").setIcon("trash-2").onClick(() => {
			options.onDelete();
		});
	});

	menu.addItem((item) => {
		item.setTitle("Duplicate").setIcon("duplicate-glyph").onClick(() => {
			options.onDuplicate();
		});
	});

	if (options.onRename) {
		menu.addItem((item) => {
			item.setTitle("Rename").setIcon("pencil").onClick(() => {
				options.onRename?.();
			});
		});
	}

	if (options.onSetColor) {
		menu.addItem((item) => {
			item.setTitle("Color").setIcon("palette").onClick(() => {
				options.onSetColor?.();
			});
		});
	}

	if (options.onTurnIntoProjectFolder) {
		menu.addItem((item) => {
			item
				.setTitle("Turn into project folder")
				.setIcon("folder")
				.onClick(() => {
					options.onTurnIntoProjectFolder?.();
				});
		});
	}

	if (options.onMoveOutOfProjectFolder) {
		menu.addItem((item) => {
			item
				.setTitle("Move out of project folder")
				.setIcon("folder-minus")
				.onClick(() => {
					options.onMoveOutOfProjectFolder?.();
				});
		});
	}

	menu.showAtMouseEvent(event);
}
