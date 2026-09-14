import { Hono } from "hono";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { revokeOAuthAccess } from "@/lib/oauth/grant";
import { requireAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.delete("/", requireAuth, async (c) => {
	const user = c.get("user");
	const clientId = c.req.param("clientId");

	if (!clientId) {
		return c.json(
			{
				error: "client_not_found",
			},
			404,
		);
	}

	const db = createDb(c.env.DB);

	await revokeOAuthAccess(db, user.id, clientId);

	await emitNotification(db, {
		userId: user.id,
		type: "security.oauth_grant_revoked",
		category: "security",
		severity: "warning",
		title: "Application Authorization Revoked",
		message: "You revoked third-party application access to your account.",
		actionUrl: "/account/authorized-apps",
	});

	return c.json({
		success: true,
	});
});

export default route;
