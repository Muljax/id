import { Hono } from "hono";

import { createDb } from "@/db";
import { listRoles } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("roles:read"), async (c) => {
	const db = createDb(c.env.DB);
	const roles = await listRoles(db);

	return c.json({
		roles,
	});
});

export default route;
