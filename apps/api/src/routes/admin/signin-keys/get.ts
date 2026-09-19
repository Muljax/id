import { Hono } from "hono";

import { createDb } from "@/db";
import { listSigninKeys } from "@/lib/signinKeys";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("settings:read"), async (c) => {
	const db = createDb(c.env.DB);
	const keys = await listSigninKeys(db);

	return c.json({
		keys,
	});
});

export default route;
