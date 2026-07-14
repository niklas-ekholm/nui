
const ROW_TRANSITION_MS = 300;

export function snapshotRowPositions(
	container: HTMLElement,
): Map<string, DOMRect> {
	const positions = new Map<string, DOMRect>();

	for (const row of Array.from(
		container.querySelectorAll<HTMLElement>(".nui-timeline-row[data-item-id]"),
	)) {
		const id = row.dataset.itemId;
		if (!id) continue;
		positions.set(id, row.getBoundingClientRect());
	}

	return positions;
}

function prefersReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function runAfterPaint(run: () => void): void {
	requestAnimationFrame(() => {
		requestAnimationFrame(run);
	});
}

function runMoveTransition(
	row: HTMLElement,
	fromTransform: string,
	onComplete?: () => void,
): void {
	row.style.transition = "none";
	row.style.transform = fromTransform;

	runAfterPaint(() => {
		row.style.transition = `transform ${ROW_TRANSITION_MS}ms ease`;
		row.style.transform = "";

		const cleanup = (event?: TransitionEvent) => {
			if (event && event.propertyName !== "transform") return;
			row.style.transition = "";
			row.style.transform = "";
			row.removeEventListener("transitionend", cleanup);
			onComplete?.();
		};
		row.addEventListener("transitionend", cleanup);
	});
}

function runFadeInTransition(row: HTMLElement): void {
	row.style.transition = "none";
	row.style.opacity = "0";

	runAfterPaint(() => {
		row.style.transition = `opacity ${ROW_TRANSITION_MS}ms ease`;
		row.style.opacity = "";

		const cleanup = (event?: TransitionEvent) => {
			if (event && event.propertyName !== "opacity") return;
			row.style.transition = "";
			row.style.opacity = "";
			row.removeEventListener("transitionend", cleanup);
		};
		row.addEventListener("transitionend", cleanup);
	});
}

function fadeInNewRows(rows: HTMLElement[]): void {
	for (const row of rows) {
		runFadeInTransition(row);
	}
}

export function animateRowTransitions(
	container: HTMLElement,
	previousPositions: Map<string, DOMRect>,
): void {
	if (previousPositions.size === 0 || prefersReducedMotion()) return;

	const rows = container.querySelectorAll<HTMLElement>(
		".nui-timeline-row[data-item-id]",
	);

	const newRows: HTMLElement[] = [];
	let movingCount = 0;
	let newRowsRevealed = false;

	const revealNewRows = () => {
		if (newRowsRevealed || newRows.length === 0) return;
		newRowsRevealed = true;
		fadeInNewRows(newRows);
	};

	for (const row of Array.from(rows)) {
		const id = row.dataset.itemId;
		if (!id) continue;

		const previousRect = previousPositions.get(id);
		if (!previousRect) {
			row.style.opacity = "0";
			newRows.push(row);
			continue;
		}

		const nextRect = row.getBoundingClientRect();
		const deltaY = previousRect.top - nextRect.top;
		if (Math.abs(deltaY) < 0.5) continue;

		movingCount += 1;
		runMoveTransition(row, `translateY(${deltaY}px)`, () => {
			movingCount -= 1;
			if (movingCount === 0) {
				revealNewRows();
			}
		});
	}

	if (newRows.length === 0) return;

	if (movingCount === 0) {
		revealNewRows();
		return;
	}

	window.setTimeout(() => {
		revealNewRows();
	}, ROW_TRANSITION_MS + 32);
}

