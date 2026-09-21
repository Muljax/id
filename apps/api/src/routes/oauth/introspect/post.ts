import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { authenticateClient } from "@/lib/oauth/client-auth";
import { getAccessToken, getRefreshToken } from "@/lib/oauth/tokens";
import { isUserDisabled } from "@/lib/user";
import { ErrorResponseSchema } from "@/schemas/common";
import { OAuthIntrospectResponseSchema } from "@/schemas/oauth";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const oauthIntrospectRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["OAuth"],
	summary: "OAuth 2.0 Token Introspection (RFC 7662)",
	description:
		"Determines the active state and metadata of an OAuth 2.0 token.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthIntrospectResponseSchema,
				},
			},
			description: "Token introspection status and metadata",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request",
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

// biome-ignore lint/suspicious/noExplicitAny: RFC 7662 introspection handler response
route.openapi(oauthIntrospectRoute, async (c): Promise<any> => {
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
		return c.json(
			{
				active: false,
			},
			200,
		);
	}

	const accessToken = await getAccessToken(db, token);

	if (accessToken && accessToken.clientId === client.id) {
		if (accessToken.userId === null) {
			// Machine-to-Machine token
			return c.json(
				{
					active: true,
					client_id: accessToken.clientId,
					sub: accessToken.clientId,
					scope: accessToken.scope,
					token_type: "Bearer",
					exp: Math.floor(accessToken.expiresAt / 1000),
					iat: Math.floor(accessToken.createdAt / 1000),
				},
				200,
			);
		}

		const userResult = await db
			.select({ id: users.id, disabledAt: users.disabledAt })
			.from(users)
			.where(eq(users.id, accessToken.userId))
			.limit(1);

		const user = userResult[0];

		if (user && !isUserDisabled(user)) {
			return c.json(
				{
					active: true,
					client_id: accessToken.clientId,
					username: accessToken.userId,
					sub: accessToken.userId,
					scope: accessToken.scope,
					token_type: "Bearer",
					exp: Math.floor(accessToken.expiresAt / 1000),
					iat: Math.floor(accessToken.createdAt / 1000),
				},
				200,
			);
		}
	}

	const refreshToken = await getRefreshToken(db, token);

	if (refreshToken && refreshToken.clientId === client.id) {
		const userResult = await db
			.select({ id: users.id, disabledAt: users.disabledAt })
			.from(users)
			.where(eq(users.id, refreshToken.userId))
			.limit(1);

		const user = userResult[0];

		if (user && !isUserDisabled(user)) {
			return c.json(
				{
					active: true,
					client_id: refreshToken.clientId,
					username: refreshToken.userId,
					sub: refreshToken.userId,
					scope: refreshToken.scope,
					token_type: "refresh_token",
					exp: Math.floor(refreshToken.expiresAt / 1000),
					iat: Math.floor(refreshToken.createdAt / 1000),
				},
				200,
			);
		}
	}

	return c.json(
		{
			active: false,
		},
		200,
	);
});

export default route;
