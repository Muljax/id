import type { NavItem } from "./types.js";

const DEFAULT_ORDER = 999;

export function sortNavItems(items: NavItem[]): NavItem[] {
	return [...items].sort((a, b) => {
		const orderDiff = (a.order ?? DEFAULT_ORDER) - (b.order ?? DEFAULT_ORDER);
		if (orderDiff !== 0) return orderDiff;

		const labelA = a.kind === "page" ? a.title : a.label;
		const labelB = b.kind === "page" ? b.title : b.label;
		return labelA.localeCompare(labelB);
	});
}
