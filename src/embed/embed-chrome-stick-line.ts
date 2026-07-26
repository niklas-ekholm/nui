import { MarkdownView, type Plugin } from "obsidian";

const SCROLLER_SELECTOR =
	".markdown-source-view.mod-cm6.is-live-preview .cm-scroller";
const CHROME_STICK_TOP_VAR = "--nui-chrome-stick-top";
const SCROLLER_PAD_TOP_VAR = "--nui-cm-scroller-pad-top";
const SCROLLER_PAD_INLINE_START_VAR = "--nui-cm-scroller-pad-inline-start";
const SCROLLER_PAD_INLINE_END_VAR = "--nui-cm-scroller-pad-inline-end";

const cleanupByScroller = new WeakMap<HTMLElement, () => void>();
const attachedScrollers = new Set<HTMLElement>();

function findLivePreviewScroller(view: MarkdownView): HTMLElement | null {
	return view.containerEl.querySelector<HTMLElement>(SCROLLER_SELECTOR);
}

const COVER_PROMOTED_HEADER_CLASS = "nui-cover-promoted-header";
const COVER_HEADER_TRACK_CLASS = "nui-cover-header-track";

/** Viewport Y at the bottom of tab strip + note header. */
function effectivePaneChromeBottom(scroller: HTMLElement): number | null {
	const tabs = scroller.closest<HTMLElement>(".workspace-tabs");
	if (!tabs) return null;

	const tabHeader = tabs.querySelector<HTMLElement>(
		":scope > .workspace-tab-header-container",
	);
	const tabBottom = tabHeader
		? tabHeader.getBoundingClientRect().bottom
		: tabs.getBoundingClientRect().top;

	const leafContent = scroller.closest<HTMLElement>(".workspace-leaf-content");
	const headerTrack = leafContent?.querySelector<HTMLElement>(
		`:scope > .${COVER_HEADER_TRACK_CLASS}`,
	);
	if (headerTrack) {
		return Math.max(tabBottom, headerTrack.getBoundingClientRect().bottom);
	}

	const promotedHeader = tabs.querySelector<HTMLElement>(
		`:scope > .view-header.${COVER_PROMOTED_HEADER_CLASS}`,
	);
	const inLeafHeader = leafContent?.querySelector<HTMLElement>(
		":scope > .view-header",
	);
	const viewHeader = promotedHeader ?? inLeafHeader ?? null;

	if (!viewHeader) {
		return tabBottom;
	}

	return Math.max(tabBottom, viewHeader.getBoundingClientRect().bottom);
}

/** Editor gutter padding for sticky breakout (cover scroll band on .cm-sizer excluded). */
function scrollerContentPaddingInset(scroller: HTMLElement): {
	top: number;
	inlineStart: number;
	inlineEnd: number;
} {
	const fromEl = (el: HTMLElement) => {
		const style = getComputedStyle(el);
		return {
			top: Number.parseFloat(style.paddingTop) || 0,
			inlineStart: Number.parseFloat(style.paddingLeft) || 0,
			inlineEnd: Number.parseFloat(style.paddingRight) || 0,
		};
	};

	const scrollerPad = fromEl(scroller);
	const sizer = scroller.querySelector<HTMLElement>(":scope > .cm-sizer");
	const sizerPad = sizer ? fromEl(sizer) : null;

	const tabs = scroller.closest<HTMLElement>(".workspace-tabs");
	if (tabs?.hasAttribute("data-nui-has-cover")) {
		const coverHeight =
			Number.parseFloat(
				getComputedStyle(tabs).getPropertyValue("--nui-note-cover-height"),
			) || 300;

		// Cover band is on .cm-sizer; .cm-scroller top pad is editor gutter (often 32px).
		const top =
			scrollerPad.top > 0
				? scrollerPad.top
				: Math.max(0, (sizerPad?.top ?? 0) - coverHeight);

		return {
			top,
			inlineStart: scrollerPad.inlineStart || sizerPad?.inlineStart || 0,
			inlineEnd: scrollerPad.inlineEnd || sizerPad?.inlineEnd || 0,
		};
	}

	let pad = scrollerPad;
	if (
		pad.top === 0 &&
		pad.inlineStart === 0 &&
		pad.inlineEnd === 0 &&
		sizerPad
	) {
		pad = sizerPad;
	}

	return pad;
}

function syncScrollerPaddingVars(scroller: HTMLElement): void {
	const pad = scrollerContentPaddingInset(scroller);
	scroller.style.setProperty(SCROLLER_PAD_TOP_VAR, `${pad.top}px`);
	scroller.style.setProperty(SCROLLER_PAD_INLINE_START_VAR, `${pad.inlineStart}px`);
	scroller.style.setProperty(SCROLLER_PAD_INLINE_END_VAR, `${pad.inlineEnd}px`);
}

export function updateChromeStickTop(scroller: HTMLElement): void {
	syncScrollerPaddingVars(scroller);

	const chromeBottom = effectivePaneChromeBottom(scroller);
	if (chromeBottom === null) {
		scroller.style.removeProperty(CHROME_STICK_TOP_VAR);
		return;
	}

	const scrollerTop = scroller.getBoundingClientRect().top;
	const stickTop = Math.max(0, chromeBottom - scrollerTop);
	scroller.style.setProperty(CHROME_STICK_TOP_VAR, `${stickTop}px`);
}

function attachChromeStickTop(scroller: HTMLElement): void {
	if (cleanupByScroller.has(scroller)) {
		updateChromeStickTop(scroller);
		return;
	}

	const onSync = (): void => {
		requestAnimationFrame(() => updateChromeStickTop(scroller));
	};

	scroller.addEventListener("scroll", onSync, { passive: true });
	window.addEventListener("resize", onSync);

	cleanupByScroller.set(scroller, () => {
		scroller.removeEventListener("scroll", onSync);
		window.removeEventListener("resize", onSync);
		scroller.style.removeProperty(CHROME_STICK_TOP_VAR);
		scroller.style.removeProperty(SCROLLER_PAD_TOP_VAR);
		scroller.style.removeProperty(SCROLLER_PAD_INLINE_START_VAR);
		scroller.style.removeProperty(SCROLLER_PAD_INLINE_END_VAR);
		cleanupByScroller.delete(scroller);
		attachedScrollers.delete(scroller);
	});

	attachedScrollers.add(scroller);
	onSync();
}

function detachChromeStickTop(scroller: HTMLElement): void {
	cleanupByScroller.get(scroller)?.();
}

function syncAllMarkdownViews(app: Plugin["app"]): void {
	const activeScrollers = new Set<HTMLElement>();

	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) continue;
		const scroller = findLivePreviewScroller(view);
		if (scroller) {
			activeScrollers.add(scroller);
			attachChromeStickTop(scroller);
		}
	}

	for (const scroller of attachedScrollers) {
		if (!activeScrollers.has(scroller)) {
			detachChromeStickTop(scroller);
		}
	}
}

export function registerEmbedChromeStickLine(plugin: Plugin): void {
	const scheduleSync = (): void => {
		requestAnimationFrame(() => syncAllMarkdownViews(plugin.app));
	};

	plugin.registerEvent(plugin.app.workspace.on("active-leaf-change", scheduleSync));
	plugin.registerEvent(plugin.app.workspace.on("layout-change", scheduleSync));
	plugin.registerEvent(plugin.app.workspace.on("file-open", scheduleSync));

	plugin.registerDomEvent(window, "resize", scheduleSync);

	scheduleSync();
}
