const HIDE_CHROME_BODY_CLASS = "nui-hide-chrome";

export function isChromeHidden(): boolean {
	return document.body.classList.contains(HIDE_CHROME_BODY_CLASS);
}

export function setChromeHidden(hidden: boolean): void {
	document.body.classList.toggle(HIDE_CHROME_BODY_CLASS, hidden);
}

export function toggleChromeHidden(): void {
	setChromeHidden(!isChromeHidden());
}
