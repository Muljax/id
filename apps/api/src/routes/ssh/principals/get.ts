import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { deriveDefaultPrincipal, getPermittedPrincipals } from "@/lib/ssh";
import { type AppEnv, requireSessionOrPermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import { SshPrincipalsResponseSchema } from "@/schemas/ssh";

export const getSshPrincipalsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["SSH Keys & CA"],
	summary: "List permitted SSH certificate principals",
	description:
		"Retrieve permitted POSIX username principals and default principal derived from user identity and RBAC permissions.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SshPrincipalsResponseSchema,
				},
			},
			description: "List of permitted principals",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use(
	"/*",
	requireSessionOrPermission(
		"ssh:cert:issue",
		"ssh:keys:manage",
		"ssh:ca:read",
		"ssh:*",
		"*",
	),
);

route.openapi(getSshPrincipalsRoute, async (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();

	const defaultPrincipal = deriveDefaultPrincipal(user);
	const principals = getPermittedPrincipals(user, roles, permissions);

	return c.json(
		{
			principals,
			defaultPrincipal,
		},
		200,
	);
});

export default route;
