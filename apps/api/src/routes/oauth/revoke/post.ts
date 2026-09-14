import { Hono } from "hono";

import { createDb } from "@/db";
import { authenticateClient } from "@/lib/oauth/client-auth";
import {
	getAccessToken,
	getRefreshToken,
	revokeAccessToken,
	revokeRefreshToken,
} from "@/lib/oauth/tokens";

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
