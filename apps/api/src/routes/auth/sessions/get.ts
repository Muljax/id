import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { getSessionUserWithSession, getUserSessions } from "@/lib/session";
import { isUserDisabled } from "@/lib/user";
import { SessionsResponseSchema } from "@/schemas/auth";
import { ErrorResponseSchema } from "@/schemas/common";

export const getSessionsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Authentication"],
	summary: "List user sessions",
	description:
		"Retrieve all active sessions for the current authenticated user.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SessionsResponseSchema,
				},
			},
			description: "List of active sessions",
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

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	getSessionsRoute,
	async (c) => {
		const token = getCookie(c, "session");

		if (!token) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const db = createDb(c.env.DB);
		const record = await getSessionUserWithSession(db, token);

		if (!record || isUserDisabled(record.user)) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const currentSession = record.session;
		const userSessions = await getUserSessions(db, currentSession.userId);

		return c.json(
			{
				sessions: userSessions.map((session) => ({
					...session,
					current: session.id === currentSession.id,
				})),
			},
			200,
		);
	},
);

export default route;
