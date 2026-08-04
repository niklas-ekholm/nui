const SCROLL_DURATION_MS = 300;

const KNOWN_SCROLL_ROOT_SELECTORS = [
	".nui-timeline-scroll",
	".cm-scroller",
	".view-content",
	".workspace-leaf-content",
];

function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function canScrollVertically(element: HTMLElement): boolean {
	return element.scrollHeight > element.clientHeight + 1;
}

function getScrollingElement(): HTMLElement | null {
	const doc = document.scrollingElement;
	return doc instanceof HTMLElement ? doc : null;
}

function findVerticalScrollContainer(row: HTMLElement): HTMLElement | null {
	for (const selector of KNOWN_SCROLL_ROOT_SELECTORS) {
		const match = row.closest<HTMLElement>(selector);
		if (match && canScrollVertically(match)) return match;
	}

	let element: HTMLElement | null = row.parentElement;
	while (element) {
		if (canScrollVertically(element)) return element;
		element = element.parentElement;
	}

	const doc = getScrollingElement();
	return doc && canScrollVertically(doc) ? doc : null;
}

function getScrollTop(element: HTMLElement): number {
	if (element === document.scrollingElement) return window.scrollY;
	return element.scrollTop;
}

function setScrollTop(element: HTMLElement, value: number): void {
	if (element === document.scrollingElement) {
		window.scrollTo({ top: value, left: window.scrollX });
		return;
	}
	element.scrollTop = value;
}

function animateScrollTop(
	element: HTMLElement,
	targetScrollTop: number,
	durationMs: number,
	onComplete?: () => void,
): void {
	const startScrollTop = getScrollTop(element);
	const delta = targetScrollTop - startScrollTop;

	if (Math.abs(delta) < 1) {
		onComplete?.();
		return;
	}

	const startTime = performance.now();

	const step = (now: number): void => {
		const elapsed = now - startTime;
		const progress = Math.min(1, elapsed / durationMs);
		setScrollTop(element, startScrollTop + delta * easeInOutCubic(progress));

		if (progress < 1) {
			requestAnimationFrame(step);
			return;
		}

		onComplete?.();
	};

	requestAnimationFrame(step);
}

function scrollElementToCenterRow(
	scrollContainer: HTMLElement,
	row: HTMLElement,
	durationMs: number,
	onComplete?: () => void,
): void {
	const rowRect = row.getBoundingClientRect();
	const rowCenter = rowRect.top + rowRect.height / 2;
	const containerRect =
		scrollContainer === document.scrollingElement
			? { top: 0, height: window.innerHeight }
			: scrollContainer.getBoundingClientRect();
	const containerCenter = containerRect.top + containerRect.height / 2;
	const targetScrollTop =
		getScrollTop(scrollContainer) + (rowCenter - containerCenter);

	animateScrollTop(scrollContainer, targetScrollTop, durationMs, onComplete);
}

export function scrollTimelineRowToCenter(
	container: HTMLElement,
	itemId: string,
	durationMs = SCROLL_DURATION_MS,
	onComplete?: () => void,
): boolean {
	const row = container.querySelector<HTMLElement>(
		`.nui-timeline-row[data-item-id="${CSS.escape(itemId)}"]`,
	);
	if (!row) return false;

	const scrollContainer = findVerticalScrollContainer(row);
	if (!scrollContainer) {
		onComplete?.();
		return false;
	}

	scrollElementToCenterRow(scrollContainer, row, durationMs, onComplete);
	return true;
}
