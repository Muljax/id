import { Hono } from "hono";

import { createDb } from "@/db";
import { revokeSigninKey } from "@/lib/signinKeys";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.delete("/", requirePermission("settings:write"), async (c) => {
	const id = c.req.param("id");

	if (!id) {
		return c.json({ error: "Key ID is required." }, 400);
	}

	const db = createDb(c.env.DB);
	await revokeSigninKey(db, id);

	return c.json({ success: true });
});

export default route;
