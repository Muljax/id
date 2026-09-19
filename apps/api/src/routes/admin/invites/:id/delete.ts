import { Hono } from "hono";

import { createDb } from "@/db";
import { revokeInviteToken } from "@/lib/invites";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.delete("/", requirePermission("users:write"), async (c) => {
	const id = c.req.param("id");

	if (!id) {
		return c.json({ error: "Invite ID is required." }, 400);
	}

	const db = createDb(c.env.DB);
	await revokeInviteToken(db, id);

	return c.json({ success: true });
});

export default route;
