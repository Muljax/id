import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { exchangeAuthorizationCode } from "@/lib/oauth/authorization-code";
import { exchangeClientCredentials } from "@/lib/oauth/client-credentials";
import { exchangeDeviceCode } from "@/lib/oauth/device";
import { exchangeRefreshToken } from "@/lib/oauth/refresh-token";
import { unsupportedGrantType } from "@/lib/oauth/responses";
import { ErrorResponseSchema } from "@/schemas/common";
import { OAuthTokenResponseSchema } from "@/schemas/oauth";

const route = new OpenAPIHono<{ Bindings: Env }>();

route.use("*", async (c, next) => {
	c.header("Cache-Control", "no-store");
	c.header("Pragma", "no-cache");

	await next();
});

export const oauthTokenRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["OAuth"],
	summary: "OAuth 2.0 Token Endpoint (RFC 6749 / RFC 8628)",
	description:
		"Exchanges authorization codes, refresh tokens, client credentials, or device codes for access and ID tokens.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthTokenResponseSchema,
				},
			},
			description:
				"Token response with access token and optional ID/refresh tokens",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid grant or token request parameters",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Client authentication failed",
		},
	},
});

// biome-ignore lint/suspicious/noExplicitAny: RFC 6749 / RFC 8628 token endpoint handler response
route.openapi(oauthTokenRoute, async (c): Promise<any> => {
	const body = (await c.req.parseBody().catch(() => ({}))) as Record<
		string,
		string | File
	>;

	switch (body.grant_type) {
		case "authorization_code":
			return exchangeAuthorizationCode(c, body);

		case "refresh_token":
			return exchangeRefreshToken(c, body);

		case "client_credentials":
			return exchangeClientCredentials(c, body);

		case "urn:ietf:params:oauth:grant-type:device_code":
			return exchangeDeviceCode(c, body);

		default:
			return unsupportedGrantType(c);
	}
});

export default route;
