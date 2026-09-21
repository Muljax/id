import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { clearSessionCookie } from "@/lib/cookie";
import { deleteSession } from "@/lib/session";
import { SuccessResponseSchema } from "@/schemas/common";

export const logoutRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Authentication"],
	summary: "User logout",
	description:
		"Terminate the current session and clear browser session cookies.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Session successfully terminated",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	logoutRoute,
	async (c) => {
		const token = getCookie(c, "session");

		if (token) {
			const db = createDb(c.env.DB);
			await deleteSession(db, token);
		}

		clearSessionCookie(c);

		return c.json(
			{
				success: true,
			},
			200,
		);
	},
);

export default route;
