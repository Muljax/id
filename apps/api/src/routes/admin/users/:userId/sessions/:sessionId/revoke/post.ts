import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { getUserSession } from "@/lib/session";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const revokeAdminUserSessionRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Admin Users"],
	summary: "Revoke specific user session",
	description: "Terminates an individual active session belonging to a user.",
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
			sessionId: z.string().openapi({
				param: {
					name: "sessionId",
					in: "path",
				},
				example: "sess_123456",
				description: "Session ID to terminate",
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
			description: "Session terminated successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing user or session ID",
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
			description: "User or session not found",
		},
	},
});

route.openapi(revokeAdminUserSessionRoute, async (c) => {
	const { userId, sessionId } = c.req.valid("param");

	const db = createDb(c.env.DB);

	const [targetUser] = await db
		.select({ id: users.id, email: users.email })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!targetUser) {
		return c.json({ error: "User not found." }, 404);
	}

	const session = await getUserSession(db, userId, sessionId);

	if (!session) {
		return c.json({ error: "Session not found." }, 404);
	}

	await db.delete(sessions).where(eq(sessions.id, session.id));

	const adminUser = c.get("user");

	await emitNotification(db, {
		userId: targetUser.id,
		type: "security.session_revoked",
		category: "security",
		severity: "warning",
		title: "Session Terminated by Administrator",
		message: `A session (${session.ipAddress || "unknown IP"}) was terminated by an administrator.`,
	});

	await emitNotification(db, {
		target: "admins",
		type: "admin.session_revoked",
		category: "security",
		severity: "info",
		title: "User Session Terminated",
		message: `Admin ${adminUser.email} terminated a session for user ${targetUser.email}.`,
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
