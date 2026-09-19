import { Hono } from "hono";

import { createDb } from "@/db";
import { getOrCreateInstanceSettings } from "@/lib/settings";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("settings:read"), async (c) => {
	const db = createDb(c.env.DB);
	const settings = await getOrCreateInstanceSettings(db);

	return c.json({
		settings,
	});
});

export default route;
