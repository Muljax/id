import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { sessions } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { getUserSession } from "@/lib/session";
import { type AppEnv, requireStrictSessionAuth } from "@/middleware/auth";
import {
	ErrorResponseSchema,
	IdParamSchema,
	SuccessResponseSchema,
} from "@/schemas/common";

export const revokeSessionRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Authentication"],
	summary: "Revoke specific session",
	description:
		"Terminate an active session by session ID for the authenticated user.",
	request: {
		params: IdParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Session successfully revoked",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Session not found",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requireStrictSessionAuth);

route.openapi(revokeSessionRoute, async (c) => {
	const user = c.get("user");
	const db = createDb(c.env.DB);
	const { id: sessionId } = c.req.valid("param");

	const session = await getUserSession(db, user.id, sessionId);

	if (!session) {
		return c.json({ error: "Session not found" }, 404);
	}

	await db.delete(sessions).where(eq(sessions.id, session.id));

	await emitNotification(db, {
		userId: user.id,
		type: "security.session_revoked",
		category: "security",
		severity: "info",
		title: "Session Terminated",
		message: `A session (${session.ipAddress || "unknown IP"}) was revoked.`,
	});

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
