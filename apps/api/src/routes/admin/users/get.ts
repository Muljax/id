import { Hono } from "hono";

import { createDb } from "@/db";
import { getUsers } from "@/lib/user";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("users:read"), async (c) => {
	const db = createDb(c.env.DB);
	const users = await getUsers(db);

	return c.json({
		users,
	});
});

export default route;
