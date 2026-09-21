import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { getUserRolesDetailed } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { UserRolesResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const getAdminUserRolesRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Admin Users"],
	summary: "Get assigned roles for user",
	description: "Lists all roles explicitly assigned to the specified user.",
	middleware: [requirePermission("roles:read")] as const,
	request: {
		params: z.object({
			userId: z.string().openapi({
				param: {
					name: "userId",
					in: "path",
				},
				example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
				description: "Target user ID",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UserRolesResponseSchema,
				},
			},
			description: "User roles list",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing user ID",
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
			description: "User not found",
		},
	},
});

route.openapi(getAdminUserRolesRoute, async (c) => {
	const { userId } = c.req.valid("param");

	const db = createDb(c.env.DB);

	const [user] = await db
		.select({ id: users.id, email: users.email })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!user) {
		return c.json({ error: "User not found." }, 404);
	}

	const roles = await getUserRolesDetailed(db, userId);

	return c.json(
		{
			userId: user.id,
			email: user.email,
			roles,
		},
		200,
	);
});

export default route;
