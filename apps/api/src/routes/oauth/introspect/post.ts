import { Hono } from "hono";

import { createDb } from "@/db";
import { authenticateClient } from "@/lib/oauth/client-auth";
import { getAccessToken, getRefreshToken } from "@/lib/oauth/tokens";

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
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
		return c.json({
			active: false,
		});
	}

	const accessToken = await getAccessToken(db, token);

	if (accessToken && accessToken.clientId === client.id) {
		return c.json({
			active: true,
			client_id: accessToken.clientId,
			username: accessToken.userId,
			sub: accessToken.userId,
			scope: accessToken.scope,
			token_type: "Bearer",
			exp: Math.floor(accessToken.expiresAt / 1000),
			iat: Math.floor(accessToken.createdAt / 1000),
		});
	}

	const refreshToken = await getRefreshToken(db, token);

	if (refreshToken && refreshToken.clientId === client.id) {
		return c.json({
			active: true,
			client_id: refreshToken.clientId,
			username: refreshToken.userId,
			sub: refreshToken.userId,
			scope: refreshToken.scope,
			token_type: "refresh_token",
			exp: Math.floor(refreshToken.expiresAt / 1000),
			iat: Math.floor(refreshToken.createdAt / 1000),
		});
	}

	return c.json({
		active: false,
	});
});

export default route;
