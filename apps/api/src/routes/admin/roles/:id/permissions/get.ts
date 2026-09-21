import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { getRole } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { RolePermissionsResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const getRolePermissionsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Admin Roles"],
	summary: "Get role permissions",
	description:
		"Lists all permissions currently attached to the specified role.",
	middleware: [requirePermission("roles:read")] as const,
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "admin",
				description: "Role ID",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: RolePermissionsResponseSchema,
				},
			},
			description: "Role permissions list",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing role ID",
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
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Role not found",
		},
	},
});

route.openapi(getRolePermissionsRoute, async (c) => {
	const { id: roleId } = c.req.valid("param");

	const db = createDb(c.env.DB);
	const role = await getRole(db, roleId);

	if (!role) {
		return c.json({ error: "Role not found." }, 404);
	}

	return c.json(
		{
			roleId: role.id,
			permissions: role.permissions,
		},
		200,
	);
});

export default route;
