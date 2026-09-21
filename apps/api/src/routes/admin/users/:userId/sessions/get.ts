import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { getUserSessions } from "@/lib/session";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { AdminUserSessionsResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const getAdminUserSessionsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Admin Users"],
	summary: "List user active sessions",
	description: "Lists all currently active sessions for the specified user.",
	middleware: [requirePermission("users:read")] as const,
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
					schema: AdminUserSessionsResponseSchema,
				},
			},
			description: "User sessions list",
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

route.openapi(getAdminUserSessionsRoute, async (c) => {
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

	const userSessions = await getUserSessions(db, userId);

	return c.json(
		{
			userId: user.id,
			sessions: userSessions,
		},
		200,
	);
});

export default route;
