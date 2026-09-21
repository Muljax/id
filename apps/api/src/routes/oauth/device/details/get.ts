import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { getDeviceCodeDetails } from "@/lib/oauth/device";
import { ErrorResponseSchema } from "@/schemas/common";
import { OAuthDeviceDetailsResponseSchema } from "@/schemas/oauth";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const getDeviceDetailsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["OAuth"],
	summary: "Get device authorization request details",
	description:
		"Validates a user code and returns the requesting application metadata and requested scopes for confirmation UI.",
	request: {
		query: z.object({
			user_code: z.string().openapi({
				param: {
					name: "user_code",
					in: "query",
				},
				example: "WDJB-4921",
				description: "The human-friendly user code entered by the user",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthDeviceDetailsResponseSchema,
				},
			},
			description: "Device authorization details and requested scopes",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid or missing user code",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Device authorization request not found or expired",
		},
	},
});

route.openapi(getDeviceDetailsRoute, async (c) => {
	const { user_code: userCode } = c.req.valid("query");
	const db = createDb(c.env.DB);

	const details = await getDeviceCodeDetails(db, userCode);
	if (!details) {
		return c.json(
			{
				error: "not_found",
				error_description:
					"The device authorization code was not found or has expired.",
			},
			404,
		);
	}

	return c.json(
		{
			client_id: details.clientId,
			client_name: details.clientName,
			scopes: details.scopes,
			status: details.status,
			expires_at: details.expiresAt,
			expired: details.expired,
		},
		200,
	);
});

export default route;
