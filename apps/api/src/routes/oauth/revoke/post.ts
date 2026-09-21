import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { authenticateClient } from "@/lib/oauth/client-auth";
import {
	getAccessToken,
	getRefreshToken,
	revokeAccessToken,
	revokeRefreshToken,
} from "@/lib/oauth/tokens";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const oauthRevokeRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["OAuth"],
	summary: "OAuth 2.0 Token Revocation (RFC 7009)",
	description: "Revokes an active access token or refresh token.",
	responses: {
		200: {
			description: "Token successfully revoked or does not exist",
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

// biome-ignore lint/suspicious/noExplicitAny: RFC 7009 revocation handler response
route.openapi(oauthRevokeRoute, async (c): Promise<any> => {
	const body = (await c.req.parseBody().catch(() => ({}))) as Record<
		string,
		unknown
	>;
	const db = createDb(c.env.DB);

	const authResult = await authenticateClient(c, body, db);

	if ("errorResponse" in authResult) {
		return authResult.errorResponse;
	}

	const { client } = authResult;
	const token = body.token;

	if (typeof token !== "string" || !token) {
		return c.body(null, 200);
	}

	const tokenTypeHint = body.token_type_hint;

	if (tokenTypeHint === "refresh_token") {
		const refreshToken = await getRefreshToken(db, token);

		if (refreshToken && refreshToken.clientId === client.id) {
			await revokeRefreshToken(db, token);
		} else {
			const accessToken = await getAccessToken(db, token);

			if (accessToken && accessToken.clientId === client.id) {
				await revokeAccessToken(db, token);
			}
		}
	} else {
		const accessToken = await getAccessToken(db, token);

		if (accessToken && accessToken.clientId === client.id) {
			await revokeAccessToken(db, token);
		} else {
			const refreshToken = await getRefreshToken(db, token);

			if (refreshToken && refreshToken.clientId === client.id) {
				await revokeRefreshToken(db, token);
			}
		}
	}

	return c.body(null, 200);
});

export default route;
