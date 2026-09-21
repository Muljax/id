import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { listAllPermissions } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { AdminPermissionsListResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const getAdminPermissionsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Admin Permissions"],
	summary: "List all RBAC permissions",
	description:
		"Lists all available system permissions grouped by resource categories.",
	middleware: [requirePermission("permissions:read")] as const,
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdminPermissionsListResponseSchema,
				},
			},
			description: "Permissions list with category mappings",
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

route.openapi(getAdminPermissionsRoute, async (c) => {
	const db = createDb(c.env.DB);
	const allPermissions = await listAllPermissions(db);

	// Group permissions by resource category
	const categories: Record<string, typeof allPermissions> = {};
	for (const perm of allPermissions) {
		const list = categories[perm.resource] ?? [];
		list.push(perm);
		categories[perm.resource] = list;
	}

	return c.json(
		{
			permissions: allPermissions,
			categories,
		},
		200,
	);
});

export default route;
