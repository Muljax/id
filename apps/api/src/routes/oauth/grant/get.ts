import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { getOAuthClient } from "@/lib/oauth/client";
import { hasOAuthGrant } from "@/lib/oauth/grant";
import { requireStrictSessionAuth } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import { OAuthGrantResponseSchema } from "@/schemas/oauth";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const getOAuthGrantRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["OAuth"],
	summary: "Check user OAuth grant status",
	description:
		"Checks if the current authenticated user has already consented to the requested client and scopes.",
	middleware: [requireStrictSessionAuth] as const,
	request: {
		query: z.object({
			client_id: z.string().openapi({
				param: {
					name: "client_id",
					in: "query",
				},
				example: "client_123456",
				description: "OAuth Client ID",
			}),
			scope: z.string().openapi({
				param: {
					name: "scope",
					in: "query",
				},
				example: "openid profile email",
				description: "Requested OAuth scopes",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthGrantResponseSchema,
				},
			},
			description: "Grant status and authentication time",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid request or unknown client",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized - User login required",
		},
	},
});

route.openapi(getOAuthGrantRoute, async (c) => {
	const { client_id: clientId, scope } = c.req.valid("query");

	const db = createDb(c.env.DB);
	const user = c.get("user");
	const session = c.get("session");

	const client = await getOAuthClient(db, clientId);

	if (!client) {
		return c.json(
			{
				error: "invalid_client",
			},
			400,
		);
	}

	const scopes = [...new Set(scope.split(" ").filter(Boolean))];

	const granted = await hasOAuthGrant(db, user.id, client.id, scopes);

	return c.json(
		{
			granted,
			auth_time: Math.floor(session.createdAt / 1000),
		},
		200,
	);
});

export default route;
