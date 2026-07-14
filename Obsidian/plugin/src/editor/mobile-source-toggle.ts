
import {
	MarkdownView,
	Platform,
	Plugin,
	setIcon,
	View,
} from "obsidian";

const ACTION_CLASS = "nui-mobile-source-toggle";

type MarkdownViewState = {
	mode?: string;
	source?: boolean;
};

type ViewWithOnOpen = View & { onOpen: () => Promise<void> };

function getMarkdownViewOnOpen(): () => Promise<void> {
	const proto = MarkdownView.prototype as unknown as ViewWithOnOpen;
	return proto.onOpen;
}

function setMarkdownViewOnOpen(onOpen: () => Promise<void>): void {
	const proto = MarkdownView.prototype as unknown as ViewWithOnOpen;
	proto.onOpen = onOpen;
}

function isSourceMode(view: MarkdownView): boolean {
	const state = view.getState() as MarkdownViewState;
	return state.mode === "source" && state.source === true;
}

function syncAction(view: MarkdownView, actionEl: HTMLElement): void {
	const inSource = isSourceMode(view);
	const title = inSource ? "Switch to edit mode" : "Switch to source mode";
	const icon = inSource ? "pencil" : "code-glyph";
	actionEl.setAttribute("aria-label", title);
	setIcon(actionEl, icon);
}

async function toggleSourceEdit(view: MarkdownView): Promise<void> {
	const current = view.getState() as MarkdownViewState;
	const next: MarkdownViewState = { ...current };

	if (current.mode === "preview") {
		next.mode = "source";
		next.source = false;
	} else if (current.mode === "source" && current.source) {
		next.source = false;
	} else {
		next.mode = "source";
		next.source = true;
	}

	await view.setState(next, { history: false });
	view.editor?.focus();
}

function ensureMobileSourceToggle(view: MarkdownView): void {
	if (!Platform.isMobile) {
		return;
	}

	const actions = view.containerEl.querySelector(".view-actions");
	if (!actions) {
		return;
	}

	let actionEl = actions.querySelector(
		`.${ACTION_CLASS}`,
	) as HTMLElement | null;

	if (!actionEl) {
		actionEl = view.addAction("code-glyph", "Switch to source mode", () => {
			void toggleSourceEdit(view).then(() => syncAction(view, actionEl!));
		});
		actionEl.addClass(ACTION_CLASS);
	}

	syncAction(view, actionEl);
}

export class MobileSourceToggle {
	constructor(private plugin: Plugin) {}

	onload(): void {
		if (!Platform.isMobile) {
			return;
		}

		this.plugin.registerEvent(
			this.plugin.app.workspace.on("layout-change", () =>
				this.syncAllActions(),
			),
		);
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("active-leaf-change", () =>
				this.syncAllActions(),
			),
		);

		this.plugin.app.workspace.onLayoutReady(() => {
			this.installOnOpenPatch();
			this.syncAllActions();
		});
	}

	private installOnOpenPatch(): void {
		const originalOnOpen = getMarkdownViewOnOpen();
		const plugin = this.plugin;

		setMarkdownViewOnOpen(async function (this: MarkdownView) {
			await originalOnOpen.call(this);
			ensureMobileSourceToggle(this);
		});

		plugin.register(() => {
			setMarkdownViewOnOpen(originalOnOpen);
		});
	}

	private syncAllActions(): void {
		if (!Platform.isMobile) {
			return;
		}

		this.plugin.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				ensureMobileSourceToggle(view);
			}
		});
	}
}

