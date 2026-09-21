import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { getOAuthClients } from "@/lib/oauth/client";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import { OAuthClientsListResponseSchema } from "@/schemas/oauth";

const route = new OpenAPIHono<AppEnv>();

export const getOAuthClientsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["OAuth Clients"],
	summary: "List all OAuth clients",
	description:
		"Lists all registered public and confidential OAuth applications.",
	middleware: [requirePermission("oauth_clients:read")] as const,
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthClientsListResponseSchema,
				},
			},
			description: "List of registered OAuth applications",
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

route.openapi(getOAuthClientsRoute, async (c) => {
	const db = createDb(c.env.DB);
	const clients = await getOAuthClients(db);

	return c.json(
		{
			clients: clients.map((client) => ({
				id: client.id,
				name: client.name,
				clientType: client.clientType,
				redirectUris: client.redirectUris,
				scopes: client.scopes,
				createdAt: client.createdAt,
				updatedAt: client.updatedAt,
			})),
		},
		200,
	);
});

export default route;
