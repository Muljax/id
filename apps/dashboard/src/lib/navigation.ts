import type { AnyRoute } from "@tanstack/react-router";
import { checkPermission } from "./permissions";

/**
 * Navigation metadata defined on a route.
 *
 * @property label The label displayed in the dashboard sidebar.
 * @property order The position of the route in the sidebar.
 * @property requiredPermission Specific permission slug needed to view this route.
 */
export interface NavigationData {
	label: string;
	order: number;
	requiredPermission?: string;
	hidden?: boolean;
}

/**
 * A single navigation item displayed in the dashboard sidebar.
 *
 * @property label The label displayed in the sidebar.
 * @property to The route path used by the sidebar link.
 * @property order The position of the item within its group.
 * @property requiredPermission Specific permission slug needed to view this item.
 */
export interface NavigationItem {
	label: string;
	to: string;
	order: number;
	requiredPermission?: string;
	hidden?: boolean;
}

/**
 * A navigation item that contains child sidebar items.
 */
export interface NavigationGroup extends NavigationItem {
	children: NavigationItem[];
}

/**
 * Gets navigation metadata defined on a route.
 *
 * @param route The route to inspect.
 * @returns The route's navigation metadata, or `undefined` when none is defined.
 */
function getNavigation(route: AnyRoute): NavigationData | undefined {
	return route.options.staticData?.navigation;
}

function isVisible(
	navigation: NavigationData,
	permissions: string[] = [],
): boolean {
	if (navigation.hidden) {
		return false;
	}

	if (navigation.requiredPermission) {
		if (!checkPermission(permissions, navigation.requiredPermission)) {
			return false;
		}
	}

	return true;
}

/**
 * Collects child navigation items from a route.
 */
function collectChildren(
	route: AnyRoute,
	permissions: string[] = [],
): NavigationItem[] {
	const items: NavigationItem[] = [];

	for (const child of route.children ?? []) {
		const navigation = getNavigation(child);

		if (!navigation) {
			items.push(...collectChildren(child, permissions));
			continue;
		}

		if (!isVisible(navigation, permissions)) {
			continue;
		}

		items.push({
			label: navigation.label,
			to: child.fullPath,
			order: navigation.order,
			requiredPermission: navigation.requiredPermission,
			hidden: navigation.hidden,
		});
	}

	return items.sort((a, b) => a.order - b.order);
}

/**
 * Collects navigation groups from a route tree.
 */
function collectNavigation(
	route: AnyRoute,
	permissions: string[] = [],
	items: NavigationGroup[] = [],
) {
	const navigation = getNavigation(route);

	if (navigation) {
		if (!isVisible(navigation, permissions)) {
			return items;
		}

		const children = collectChildren(route, permissions);

		// If this group defines child routes in the route tree, but none are visible to the user,
		// and the parent doesn't have a requiredPermission of its own, omit this group.
		const hasConfiguredChildren = Boolean(
			route.children?.some((c: AnyRoute) => Boolean(getNavigation(c))),
		);
		if (hasConfiguredChildren && children.length === 0) {
			return items;
		}

		items.push({
			label: navigation.label,
			to: route.fullPath,
			order: navigation.order,
			requiredPermission: navigation.requiredPermission,
			hidden: navigation.hidden,
			children,
		});

		return items;
	}

	for (const child of route.children ?? []) {
		collectNavigation(child, permissions, items);
	}

	return items;
}

/**
 * Builds the navigation items visible in the dashboard sidebar.
 */
export function getNavigationItems(
	routeTree: AnyRoute,
	permissions: string[] = [],
): NavigationGroup[] {
	return collectNavigation(routeTree, permissions).sort(
		(a, b) => a.order - b.order,
	);
}
