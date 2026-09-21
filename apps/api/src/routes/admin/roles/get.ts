import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { listRoles } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { AdminRolesListResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const getAdminRolesRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Admin Roles"],
	summary: "List all roles",
	description: "Lists all system and custom RBAC roles in the tenant.",
	middleware: [requirePermission("roles:read")] as const,
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdminRolesListResponseSchema,
				},
			},
			description: "List of roles",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Forbidden - Insufficient permissions",
		},
	},
});

route.openapi(getAdminRolesRoute, async (c) => {
	const db = createDb(c.env.DB);
	const roles = await listRoles(db);

	return c.json(
		{
			roles,
		},
		200,
	);
});

export default route;
