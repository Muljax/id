import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { getUsers } from "@/lib/user";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { AdminUsersListResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const getAdminUsersRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Admin Users"],
	summary: "List all users",
	description: "Lists all registered user accounts with their assigned roles.",
	middleware: [requirePermission("users:read")] as const,
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdminUsersListResponseSchema,
				},
			},
			description: "List of users",
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

route.openapi(getAdminUsersRoute, async (c) => {
	const db = createDb(c.env.DB);
	const users = await getUsers(db);

	return c.json(
		{
			users,
		},
		200,
	);
});

export default route;
