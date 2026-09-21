import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { deleteAllSessions } from "@/lib/session";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const revokeAllAdminUserSessionsRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Admin Users"],
	summary: "Revoke all user sessions",
	description: "Terminates all active sessions for the specified user account.",
	middleware: [requirePermission("users:write")] as const,
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
					schema: SuccessResponseSchema,
				},
			},
			description: "All user sessions terminated successfully",
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

route.openapi(revokeAllAdminUserSessionsRoute, async (c) => {
	const { userId } = c.req.valid("param");

	const db = createDb(c.env.DB);

	const [targetUser] = await db
		.select({ id: users.id, email: users.email })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!targetUser) {
		return c.json({ error: "User not found." }, 404);
	}

	await deleteAllSessions(db, userId);

	const adminUser = c.get("user");

	await emitNotification(db, {
		userId: targetUser.id,
		type: "security.sessions_revoked",
		category: "security",
		severity: "warning",
		title: "All Sessions Terminated by Administrator",
		message: "All your active sessions were terminated by an administrator.",
	});

	await emitNotification(db, {
		target: "admins",
		type: "admin.sessions_revoked",
		category: "security",
		severity: "warning",
		title: "All User Sessions Terminated",
		message: `Admin ${adminUser.email} terminated all active sessions for user ${targetUser.email}.`,
		actionUrl: `/admin/users?userId=${encodeURIComponent(targetUser.id)}`,
	});

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
