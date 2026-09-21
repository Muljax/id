import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { deleteOtherSessions } from "@/lib/session";
import {
	type AppEnv,
	requireElevatedSession,
	requireStrictSessionAuth,
} from "@/middleware/auth";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

export const revokeAllSessionsRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Authentication"],
	summary: "Revoke all other sessions",
	description:
		"Terminate all other active sessions except the current caller's session.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "All other sessions revoked",
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

route.use("/*", requireStrictSessionAuth, requireElevatedSession);

route.openapi(revokeAllSessionsRoute, async (c) => {
	const user = c.get("user");
	const currentSession = c.get("session");
	const db = createDb(c.env.DB);

	await deleteOtherSessions(db, user.id, currentSession.id);

	await emitNotification(db, {
		userId: user.id,
		type: "security.sessions_revoked",
		category: "security",
		severity: "warning",
		title: "All Other Sessions Terminated",
		message: "You signed out of all other active sessions.",
	});

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
