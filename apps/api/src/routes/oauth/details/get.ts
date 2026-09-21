import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { getOAuthClient, validateRedirectUri } from "@/lib/oauth/client";
import { ErrorResponseSchema } from "@/schemas/common";
import { OAuthDetailsResponseSchema } from "@/schemas/oauth";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const getOAuthDetailsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["OAuth"],
	summary: "Get OAuth client details for consent UI",
	description:
		"Validates and returns basic client information and redirect URI validity for consent screens.",
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
			redirect_uri: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "redirect_uri",
						in: "query",
					},
					example: "https://my-app.example.com/callback",
					description: "Client redirect URI to validate",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthDetailsResponseSchema,
				},
			},
			description: "Client details and redirect URI validation status",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Unknown client or invalid redirect URI",
		},
	},
});

route.openapi(getOAuthDetailsRoute, async (c) => {
	const { client_id: clientId, redirect_uri: redirectUri } =
		c.req.valid("query");

	const db = createDb(c.env.DB);
	const client = await getOAuthClient(db, clientId);

	if (!client) {
		return c.json(
			{
				error: "invalid_request",
				error_description: "Unknown client.",
			},
			400,
		);
	}

	if (redirectUri && !validateRedirectUri(client, redirectUri)) {
		return c.json(
			{
				error: "invalid_request",
				error_description: "Invalid redirect URI.",
			},
			400,
		);
	}

	return c.json(
		{
			client_id: client.id,
			name: client.name,
			redirect_uri_valid: Boolean(redirectUri),
		},
		200,
	);
});

export default route;
