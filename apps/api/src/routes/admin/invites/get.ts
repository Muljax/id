import { Hono } from "hono";

import { createDb } from "@/db";
import { listInviteTokens } from "@/lib/invites";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("users:read"), async (c) => {
	const db = createDb(c.env.DB);
	const invites = await listInviteTokens(db);

	return c.json({
		invites,
	});
});

export default route;
