import { Hono } from "hono";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { deleteOAuthClient } from "@/lib/oauth/client";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.delete("/", requirePermission("oauth_clients:write"), async (c) => {
	const clientId = c.req.param("id");

	if (!clientId) {
		return c.json(
			{
				error: "client_not_found",
			},
			404,
		);
	}

	const db = createDb(c.env.DB);
	const client = await deleteOAuthClient(db, clientId);

	if (!client) {
		return c.json(
			{
				error: "client_not_found",
			},
			404,
		);
	}

	await emitNotification(db, {
		target: "admins",
		type: "admin.client_deleted",
		category: "admin",
		severity: "warning",
		title: "OAuth Client Deleted",
		message: `OAuth client "${client.name}" (${client.id}) was deleted.`,
		actionUrl: "/admin/clients",
	});

	return c.body(null, 204);
});

export default route;
