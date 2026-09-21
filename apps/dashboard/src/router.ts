import { createRouter } from "@tanstack/react-router";

import type { AuthContextValue } from "@/context/AuthContext";
import type { NavigationData } from "@/lib/navigation";

// biome-ignore lint/suspicious/noTsIgnore: TanStack Router generates the route type.
// @ts-ignore
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
	auth: AuthContextValue;
}

export const router = createRouter({
	routeTree,
	context: {} as RouterContext,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}

	interface StaticDataRouteOption {
		navigation?: NavigationData;
		title?: string;
	}
}
