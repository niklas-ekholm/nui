
export function trackPointerDrag(options: {
	event: PointerEvent;
	onMove: (event: PointerEvent) => void;
	onEnd: (event: PointerEvent) => void;
	onCancel?: () => void;
}): void {
	const pointerId = options.event.pointerId;
	const captureTarget =
		options.event.currentTarget instanceof HTMLElement
			? options.event.currentTarget
			: document.body;

	const onMove = (event: PointerEvent) => {
		if (event.pointerId !== pointerId) return;
		options.onMove(event);
	};

	const onEnd = (event: PointerEvent) => {
		if (event.pointerId !== pointerId) return;
		cleanup();
		options.onEnd(event);
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.code !== "Escape" || !options.onCancel) return;
		event.preventDefault();
		cleanup();
		options.onCancel();
	};

	const cleanup = () => {
		captureTarget.removeEventListener("pointermove", onMove);
		captureTarget.removeEventListener("pointerup", onEnd);
		captureTarget.removeEventListener("pointercancel", onEnd);
		document.removeEventListener("keydown", onKeyDown);
		if (captureTarget.hasPointerCapture?.(pointerId)) {
			captureTarget.releasePointerCapture(pointerId);
		}
	};

	captureTarget.setPointerCapture?.(pointerId);
	captureTarget.addEventListener("pointermove", onMove);
	captureTarget.addEventListener("pointerup", onEnd);
	captureTarget.addEventListener("pointercancel", onEnd);
	if (options.onCancel) {
		document.addEventListener("keydown", onKeyDown);
	}
}

