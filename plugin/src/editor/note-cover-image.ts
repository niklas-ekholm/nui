import { MarkdownView, type App, type Plugin, type TFile } from "obsidian";
import { resolveNoteImageSrc } from "../core/resolve/note-image";

const COVER_IMAGE_FIELD = "coverimage";
const COVER_CLASS = "nui-note-cover";
const COVER_FADE_CLASS = "nui-note-cover-top-fade";
const COVER_HEADER_TRACK_CLASS = "nui-cover-header-track";
const COVER_ATTR = "data-nui-has-cover";
const COVER_HEADER_STICKY_CLASS = "nui-cover-header-sticky";
const COVER_PROMOTED_HEADER_CLASS = "nui-cover-promoted-header";
const COVER_FADE_DISTANCE = 100;

const scrollCleanupByView = new WeakMap<MarkdownView, () => void>();
const headerPlaceholderByView = new WeakMap<MarkdownView, HTMLElement>();

function findLeafContent(view: MarkdownView): HTMLElement | null {
	return (
		view.containerEl.closest<HTMLElement>(".workspace-leaf-content") ??
		view.containerEl
	);
}

function findCoverMount(view: MarkdownView): HTMLElement {
	return (
		view.containerEl.closest<HTMLElement>(".workspace-tabs") ?? view.containerEl
	);
}

function findViewHeader(view: MarkdownView): HTMLElement | null {
	const mount = findCoverMount(view);
	const promoted = mount.querySelector<HTMLElement>(
		`:scope > .${COVER_PROMOTED_HEADER_CLASS}`,
	);
	if (promoted) {
		return promoted;
	}

	const leafContent = findLeafContent(view);
	return (
		leafContent?.querySelector<HTMLElement>(":scope > .view-header") ??
		view.containerEl.querySelector<HTMLElement>(".view-header")
	);
}

export function readNoteCoverImageRaw(app: App, file: TFile): string | null {
	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const raw = frontmatter?.[COVER_IMAGE_FIELD];
	if (typeof raw !== "string" || !raw.trim()) {
		return null;
	}

	return raw.trim();
}

export function readNoteCoverImageSrc(app: App, file: TFile): string | null {
	const raw = readNoteCoverImageRaw(app, file);
	if (!raw) {
		return null;
	}

	return resolveNoteImageSrc(app, raw, file.path);
}

function shouldShowCover(view: MarkdownView): boolean {
	const mode = view.getMode();
	if (mode === "preview") {
		return true;
	}

	if (mode !== "source") {
		return false;
	}

	return (
		view.containerEl
			.querySelector(".markdown-source-view.mod-cm6")
			?.classList.contains("is-live-preview") ?? false
	);
}

function findScrollRoot(view: MarkdownView): HTMLElement | null {
	if (view.getMode() === "preview") {
		return view.containerEl.querySelector<HTMLElement>(".view-content");
	}

	return view.containerEl.querySelector<HTMLElement>(
		".markdown-source-view.mod-cm6.is-live-preview .cm-scroller",
	);
}

function resetCoverHeaderStyles(header: HTMLElement | null): void {
	if (!header) {
		return;
	}

	header.classList.remove(COVER_HEADER_STICKY_CLASS);
	header.style.removeProperty("transform");
	header.style.removeProperty("top");
	header.style.removeProperty("left");
	header.style.removeProperty("width");
}

/**
 * Lift the view header onto `.workspace-tabs` so it can stack above the cover.
 * Inside the leaf it is trapped under the cover by Obsidian's stacking context.
 */
function promoteViewHeader(
	view: MarkdownView,
	mount: HTMLElement,
): HTMLElement | null {
	const header = findViewHeader(view);
	if (!header) {
		return null;
	}

	if (header.parentElement === mount) {
		header.classList.add(COVER_PROMOTED_HEADER_CLASS);
		return header;
	}

	const parent = header.parentElement;
	if (!parent) {
		return null;
	}

	const placeholder = document.createElement("div");
	placeholder.className = COVER_HEADER_TRACK_CLASS;
	placeholder.setAttribute("aria-hidden", "true");
	placeholder.style.height = `${header.offsetHeight}px`;
	parent.insertBefore(placeholder, header);
	headerPlaceholderByView.set(view, placeholder);
	header.classList.add(COVER_PROMOTED_HEADER_CLASS);
	mount.appendChild(header);
	return header;
}

function restoreViewHeader(view: MarkdownView): void {
	const mount = findCoverMount(view);
	const header =
		mount.querySelector<HTMLElement>(
			`:scope > .${COVER_PROMOTED_HEADER_CLASS}`,
		) ?? null;
	const placeholder = headerPlaceholderByView.get(view);

	resetCoverHeaderStyles(header);

	if (header) {
		header.classList.remove(COVER_PROMOTED_HEADER_CLASS);
		if (placeholder?.parentNode) {
			placeholder.parentNode.insertBefore(header, placeholder);
			placeholder.remove();
		}
	} else if (placeholder?.parentNode) {
		placeholder.remove();
	}

	headerPlaceholderByView.delete(view);
}

function detachScrollFade(view: MarkdownView): void {
	scrollCleanupByView.get(view)?.();
	scrollCleanupByView.delete(view);
	restoreViewHeader(view);
}

function attachScrollFade(view: MarkdownView, cover: HTMLElement): void {
	detachScrollFade(view);

	const scrollEl = findScrollRoot(view);
	if (!scrollEl) {
		return;
	}

	const mount = findCoverMount(view);
	const leafContent = findLeafContent(view);
	const header = promoteViewHeader(view, mount);
	let headerRestOffset = 0;

	const layoutPromotedHeader = (): void => {
		if (!header || !leafContent) {
			headerRestOffset = 0;
			return;
		}

		const mountRect = mount.getBoundingClientRect();
		const leafRect = leafContent.getBoundingClientRect();
		const coverRect = cover.getBoundingClientRect();
		const tabHeader = mount.querySelector<HTMLElement>(
			":scope > .workspace-tab-header-container",
		);
		const tabBottom = tabHeader
			? tabHeader.getBoundingClientRect().bottom
			: mountRect.top;

		// Stick just under the tab bar; rest below the cover.
		const stickyTop = Math.max(0, tabBottom - mountRect.top);
		const restTop = Math.max(stickyTop, coverRect.bottom - mountRect.top);
		// Scroll distance from "under tabs" to "below cover". Do not bake in
		// scrollTop here — updateChrome subtracts live scrollTop from this value.
		headerRestOffset = Math.max(0, restTop - stickyTop);

		header.style.left = `${leafRect.left - mountRect.left}px`;
		header.style.width = `${leafRect.width}px`;
		header.style.top = `${stickyTop}px`;

		const placeholder = headerPlaceholderByView.get(view);
		if (placeholder) {
			placeholder.style.height = `${header.offsetHeight}px`;
		}
	};

	const updateChrome = (): void => {
		const scrollTop = scrollEl.scrollTop;
		const opacity = Math.max(0, 1 - scrollTop / COVER_FADE_DISTANCE);
		cover.style.opacity = String(opacity);

		if (!header) {
			return;
		}

		const translateY = Math.max(0, headerRestOffset - scrollTop);
		header.style.transform = `translateY(${translateY}px)`;
		header.classList.toggle(COVER_HEADER_STICKY_CLASS, translateY <= 0.5);
	};

	const onResize = (): void => {
		layoutPromotedHeader();
		updateChrome();
	};

	scrollEl.addEventListener("scroll", updateChrome, { passive: true });
	window.addEventListener("resize", onResize);
	scrollCleanupByView.set(view, () => {
		scrollEl.removeEventListener("scroll", updateChrome);
		window.removeEventListener("resize", onResize);
		cover.style.removeProperty("opacity");
		restoreViewHeader(view);
	});

	requestAnimationFrame(() => {
		layoutPromotedHeader();
		updateChrome();
	});
}

function removeAllCovers(view: MarkdownView): void {
	detachScrollFade(view);

	const mount = findCoverMount(view);
	mount.querySelector(`:scope > .${COVER_CLASS}`)?.remove();
	mount.querySelector(`:scope > .${COVER_FADE_CLASS}`)?.remove();
	mount.removeAttribute(COVER_ATTR);

	for (const el of Array.from(
		view.containerEl.querySelectorAll<HTMLElement>(
			`.${COVER_CLASS}, .${COVER_FADE_CLASS}, .nui-note-cover-track, .${COVER_HEADER_TRACK_CLASS}`,
		),
	)) {
		el.remove();
	}

	// Any promoted header left behind (e.g. after a partial cleanup).
	for (const el of Array.from(
		mount.querySelectorAll<HTMLElement>(`.${COVER_PROMOTED_HEADER_CLASS}`),
	)) {
		el.classList.remove(COVER_PROMOTED_HEADER_CLASS);
		resetCoverHeaderStyles(el);
	}

	view.containerEl
		.querySelector<HTMLElement>(".view-content")
		?.removeAttribute(COVER_ATTR);
	findLeafContent(view)?.removeAttribute(COVER_ATTR);
}

function upsertTopFade(mount: HTMLElement): void {
	let fade = mount.querySelector<HTMLElement>(`:scope > .${COVER_FADE_CLASS}`);
	if (!fade) {
		fade = document.createElement("div");
		fade.className = COVER_FADE_CLASS;
		fade.setAttribute("aria-hidden", "true");
		mount.prepend(fade);
	} else if (fade.parentElement !== mount) {
		fade.remove();
		mount.prepend(fade);
	}
}

function upsertCoverInMount(mount: HTMLElement, src: string | null): HTMLElement {
	upsertTopFade(mount);

	let cover = mount.querySelector<HTMLElement>(`:scope > .${COVER_CLASS}`);

	if (!cover) {
		cover = document.createElement("div");
		cover.className = COVER_CLASS;

		const img = document.createElement("img");
		img.alt = "";
		img.decoding = "async";
		cover.appendChild(img);

		mount.prepend(cover);
	} else if (cover.parentElement !== mount) {
		cover.remove();
		mount.prepend(cover);
	}

	mount.setAttribute(COVER_ATTR, "true");

	const img = cover.querySelector("img");
	if (img) {
		if (src) {
			cover.classList.remove(`${COVER_CLASS}--placeholder`);
			img.style.display = "";
			if (img.getAttribute("src") !== src) {
				img.setAttribute("src", src);
			}
		} else {
			cover.classList.add(`${COVER_CLASS}--placeholder`);
			img.removeAttribute("src");
			img.style.display = "none";
		}
	}

	return cover;
}

function syncNoteCoverInView(view: MarkdownView, app: App): void {
	const file = view.file;

	removeAllCovers(view);

	if (!file) {
		return;
	}

	const hasProperty = readNoteCoverImageRaw(app, file) !== null;
	if (!hasProperty || !shouldShowCover(view)) {
		return;
	}

	const src = readNoteCoverImageSrc(app, file);
	const mount = findCoverMount(view);
	const cover = upsertCoverInMount(mount, src);
	attachScrollFade(view, cover);
}

function isViewActiveInTabGroup(view: MarkdownView): boolean {
	return (
		view.containerEl.closest(".workspace-leaf")?.classList.contains("mod-active") ??
		false
	);
}

function syncNoteCoverForFile(app: App, file: TFile): void {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView) || view.file?.path !== file.path) {
			continue;
		}

		// Cover mounts on shared `.workspace-tabs` — only the active tab may own it.
		if (!isViewActiveInTabGroup(view)) {
			continue;
		}

		syncNoteCoverInView(view, app);
	}
}

function syncAllOpenNoteCovers(app: App): void {
	const processedMounts = new Set<HTMLElement>();

	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView) || !isViewActiveInTabGroup(view)) {
			continue;
		}

		const mount = findCoverMount(view);
		if (processedMounts.has(mount)) {
			continue;
		}
		processedMounts.add(mount);
		syncNoteCoverInView(view, app);
	}

	// Clear leftover covers when the active tab in a group is not markdown.
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) {
			continue;
		}

		const mount = findCoverMount(view);
		if (processedMounts.has(mount)) {
			continue;
		}
		processedMounts.add(mount);
		removeAllCovers(view);
	}
}

export function registerNoteCoverImageSync(plugin: Plugin): void {
	let syncTimer: number | null = null;

	const scheduleSync = (): void => {
		if (syncTimer !== null) {
			window.clearTimeout(syncTimer);
		}

		syncTimer = window.setTimeout(() => {
			syncTimer = null;
			requestAnimationFrame(() => {
				syncAllOpenNoteCovers(plugin.app);
			});
		}, 0);
	};

	plugin.registerEvent(
		plugin.app.workspace.on("active-leaf-change", scheduleSync),
	);
	plugin.registerEvent(
		plugin.app.workspace.on("layout-change", scheduleSync),
	);
	plugin.registerEvent(
		plugin.app.workspace.on("file-open", scheduleSync),
	);
	plugin.registerEvent(
		plugin.app.metadataCache.on("changed", (file) => {
			syncNoteCoverForFile(plugin.app, file);
		}),
	);

	scheduleSync();
}
