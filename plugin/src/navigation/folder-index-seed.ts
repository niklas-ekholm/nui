/**
 * Seed content for a freshly created hub note. One blank line above and below
 * the Navigation.base embed; inline title shows the folder name (no H1).
 */
export function buildFolderIndexContent(): string {
	return "\n![[Navigation.base]]\n";
}
