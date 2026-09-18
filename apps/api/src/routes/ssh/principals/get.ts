import { Hono } from "hono";

import { deriveDefaultPrincipal, getPermittedPrincipals } from "@/lib/ssh";
import { type AppEnv, requireSessionOrPermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get(
	"/",
	requireSessionOrPermission(
		"ssh:cert:issue",
		"ssh:keys:manage",
		"ssh:ca:read",
		"ssh:*",
		"*",
	),
	async (c) => {
		const user = c.get("user");
		const roles = c.get("roles") ?? [];
		const permissions = c.get("permissions") ?? new Set();

		const defaultPrincipal = deriveDefaultPrincipal(user);
		const principals = getPermittedPrincipals(user, roles, permissions);

		return c.json({
			principals,
			defaultPrincipal,
		});
	},
);

export default route;
