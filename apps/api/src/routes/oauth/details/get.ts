import { Hono } from "hono";

import { createDb } from "@/db";
import { getOAuthClient, validateRedirectUri } from "@/lib/oauth/client";

const route = new Hono<{ Bindings: Env }>();

route.get("/", async (c) => {
	const clientId = c.req.query("client_id");
	const redirectUri = c.req.query("redirect_uri");

	if (!clientId) {
		return c.json(
			{
				error: "invalid_request",
				error_description: "client_id is required.",
			},
			400,
		);
	}

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

	return c.json({
		client_id: client.id,
		name: client.name,
		redirect_uri_valid: Boolean(redirectUri),
	});
});

export default route;
