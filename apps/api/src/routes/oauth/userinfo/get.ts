import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { ErrorResponseSchema } from "@/schemas/common";
import { OAuthUserInfoResponseSchema } from "@/schemas/oauth";
import { userinfo } from "./handler";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const getOAuthUserInfoRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["OpenID Connect"],
	summary: "OpenID Connect UserInfo Endpoint (GET)",
	description:
		"Returns identity and profile claims about the authenticated user based on granted scopes.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthUserInfoResponseSchema,
				},
			},
			description: "User profile claims",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized - Invalid or missing bearer token",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Forbidden - Token lacks 'openid' scope",
		},
	},
});

route.openapi(getOAuthUserInfoRoute, userinfo);

export default route;
