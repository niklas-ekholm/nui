
import { Menu } from "obsidian";

export interface TimelineEmptyMenuOptions {
	onNew: () => void;
}

export function showTimelineEmptyMenu(
	event: MouseEvent,
	options: TimelineEmptyMenuOptions,
): void {
	event.preventDefault();
	event.stopPropagation();

	const menu = new Menu();

	menu.addItem((item) => {
		item.setTitle("New").setIcon("plus").onClick(() => {
			options.onNew();
		});
	});

	menu.showAtMouseEvent(event);
}
