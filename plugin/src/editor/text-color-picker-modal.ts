import { App, Modal } from "obsidian";
import type { ColorPickerHistory } from "./color-picker-history";
import { DEFAULT_TEXT_COLOR, normalizeHexColor } from "./text-color-utils";

export type TextColorPickerOptions = {
	mode: "span" | "note" | "property";
	initialColor?: string;
	history?: ColorPickerHistory;
	onApply: (color: string) => void | Promise<void>;
	onClear: () => void | Promise<void>;
};

export function openTextColorPicker(
	app: App,
	options: TextColorPickerOptions,
): void {
	const modal = new TextColorPickerModal(app, options);
	modal.open();
}

type Hsv = { h: number; s: number; v: number };

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const normalized = normalizeHexColor(hex);
	if (!normalized) return null;
	return {
		r: Number.parseInt(normalized.slice(1, 3), 16),
		g: Number.parseInt(normalized.slice(3, 5), 16),
		b: Number.parseInt(normalized.slice(5, 7), 16),
	};
}

function rgbToHex(r: number, g: number, b: number): string {
	const to = (n: number) =>
		Math.round(Math.min(255, Math.max(0, n)))
			.toString(16)
			.padStart(2, "0");
	return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsv(r: number, g: number, b: number): Hsv {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const d = max - min;

	let h = 0;
	if (d !== 0) {
		if (max === rn) h = ((gn - bn) / d) % 6;
		else if (max === gn) h = (bn - rn) / d + 2;
		else h = (rn - gn) / d + 4;
		h *= 60;
		if (h < 0) h += 360;
	}

	return {
		h,
		s: max === 0 ? 0 : d / max,
		v: max,
	};
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
	const c = v * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = v - c;

	let rp = 0;
	let gp = 0;
	let bp = 0;
	if (h < 60) {
		rp = c;
		gp = x;
	} else if (h < 120) {
		rp = x;
		gp = c;
	} else if (h < 180) {
		gp = c;
		bp = x;
	} else if (h < 240) {
		gp = x;
		bp = c;
	} else if (h < 300) {
		rp = x;
		bp = c;
	} else {
		rp = c;
		bp = x;
	}

	return {
		r: (rp + m) * 255,
		g: (gp + m) * 255,
		b: (bp + m) * 255,
	};
}

function hexToHsv(hex: string): Hsv {
	const rgb = hexToRgb(hex) ?? hexToRgb(DEFAULT_TEXT_COLOR)!;
	return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

function hsvToHex(hsv: Hsv): string {
	const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
	return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function hueCss(h: number): string {
	const rgb = hsvToRgb(h, 1, 1);
	return rgbToHex(rgb.r, rgb.g, rgb.b);
}

class TextColorPickerModal extends Modal {
	private hsv: Hsv;
	private hexInput!: HTMLInputElement;
	private svEl!: HTMLDivElement;
	private svThumb!: HTMLDivElement;
	private hueEl!: HTMLDivElement;
	private hueThumb!: HTMLDivElement;
	private previewEl!: HTMLDivElement;
	private recentEl: HTMLDivElement | null = null;

	constructor(
		app: App,
		private options: TextColorPickerOptions,
	) {
		super(app);
		this.hsv = hexToHsv(options.initialColor ?? DEFAULT_TEXT_COLOR);
	}

	onOpen(): void {
		this.modalEl.addClass("nui-color-picker-modal");
		this.setTitle(
			this.options.mode === "span"
				? "Text color"
				: this.options.mode === "property"
					? "Color"
					: "Note text color",
		);

		const root = this.contentEl.createDiv({ cls: "nui-color-picker" });

		this.svEl = root.createDiv({ cls: "nui-color-picker-sv" });
		this.svThumb = this.svEl.createDiv({ cls: "nui-color-picker-thumb" });
		this.bindDrag(this.svEl, (x, y, rect) => {
			this.hsv.s = Math.min(1, Math.max(0, x / rect.width));
			this.hsv.v = Math.min(1, Math.max(0, 1 - y / rect.height));
			this.syncUi({ fromHex: false });
		});

		this.hueEl = root.createDiv({ cls: "nui-color-picker-hue" });
		this.hueThumb = this.hueEl.createDiv({
			cls: "nui-color-picker-thumb nui-color-picker-hue-thumb",
		});
		this.bindDrag(this.hueEl, (x, _y, rect) => {
			this.hsv.h = Math.min(359.999, Math.max(0, (x / rect.width) * 360));
			this.syncUi({ fromHex: false });
		});

		this.renderRecentColors(root);

		const row = root.createDiv({ cls: "nui-color-picker-row" });
		this.previewEl = row.createDiv({ cls: "nui-color-picker-preview" });

		this.hexInput = row.createEl("input", {
			cls: "nui-color-picker-hex",
			attr: { type: "text", spellcheck: "false", maxlength: "7" },
		});
		this.hexInput.addEventListener("input", () => {
			const normalized = normalizeHexColor(this.hexInput.value);
			if (!normalized) return;
			this.hsv = hexToHsv(normalized);
			this.syncUi({ fromHex: true });
		});
		this.hexInput.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter") {
				evt.preventDefault();
				void this.apply();
			}
		});

		const applyBtn = row.createEl("button", {
			cls: "mod-cta",
			text: "Apply",
		});
		applyBtn.addEventListener("click", () => {
			void this.apply();
		});

		const clearBtn = row.createEl("button", { text: "Clear" });
		clearBtn.addEventListener("click", () => {
			void this.clear();
		});

		this.syncUi({ fromHex: false });
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async apply(): Promise<void> {
		const color = normalizeHexColor(hsvToHex(this.hsv)) ?? DEFAULT_TEXT_COLOR;
		await this.options.history?.rememberColor(color);
		await this.options.onApply(color);
		this.close();
	}

	private renderRecentColors(root: HTMLElement): void {
		const recent = this.options.history?.recentColors ?? [];
		if (recent.length === 0) {
			this.recentEl = null;
			return;
		}

		this.recentEl = root.createDiv({ cls: "nui-color-picker-recent" });
		for (const color of recent) {
			const swatch = this.recentEl.createEl("button", {
				type: "button",
				cls: "nui-color-picker-recent-swatch",
				attr: { "aria-label": color },
			});
			swatch.style.backgroundColor = color;
			swatch.addEventListener("click", () => {
				this.hsv = hexToHsv(color);
				this.syncUi({ fromHex: false });
			});
		}
	}

	private async clear(): Promise<void> {
		await this.options.onClear();
		this.close();
	}

	private syncUi(opts: { fromHex: boolean }): void {
		const hex = hsvToHex(this.hsv);
		this.svEl.style.backgroundColor = hueCss(this.hsv.h);
		this.svThumb.style.left = `${this.hsv.s * 100}%`;
		this.svThumb.style.top = `${(1 - this.hsv.v) * 100}%`;
		this.hueThumb.style.left = `${(this.hsv.h / 360) * 100}%`;
		this.previewEl.style.backgroundColor = hex;
		if (!opts.fromHex) {
			this.hexInput.value = hex;
		}
	}

	private bindDrag(
		el: HTMLElement,
		onMove: (x: number, y: number, rect: DOMRect) => void,
	): void {
		const update = (clientX: number, clientY: number) => {
			const rect = el.getBoundingClientRect();
			onMove(clientX - rect.left, clientY - rect.top, rect);
		};

		el.addEventListener("pointerdown", (evt) => {
			if (evt.button !== 0) return;
			evt.preventDefault();
			el.setPointerCapture(evt.pointerId);
			update(evt.clientX, evt.clientY);

			const onPointerMove = (moveEvt: PointerEvent) => {
				update(moveEvt.clientX, moveEvt.clientY);
			};
			const onPointerUp = () => {
				el.releasePointerCapture(evt.pointerId);
				el.removeEventListener("pointermove", onPointerMove);
				el.removeEventListener("pointerup", onPointerUp);
			};
			el.addEventListener("pointermove", onPointerMove);
			el.addEventListener("pointerup", onPointerUp);
		});
	}
}
