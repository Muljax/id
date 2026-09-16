import { Hono } from "hono";

import { createDb } from "@/db";
import { getOAuthClients } from "@/lib/oauth/client";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("oauth_clients:read"), async (c) => {
	const db = createDb(c.env.DB);
	const clients = await getOAuthClients(db);

	return c.json({
		clients: clients.map((client) => ({
			id: client.id,
			name: client.name,
			clientType: client.clientType,
			redirectUris: client.redirectUris,
			scopes: client.scopes,
			createdAt: client.createdAt,
			updatedAt: client.updatedAt,
		})),
	});
});

export default route;
