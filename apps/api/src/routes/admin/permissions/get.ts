import { Hono } from "hono";

import { createDb } from "@/db";
import { listAllPermissions } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("permissions:read"), async (c) => {
	const db = createDb(c.env.DB);
	const allPermissions = await listAllPermissions(db);

	// Group permissions by resource category
	const categories: Record<string, typeof allPermissions> = {};
	for (const perm of allPermissions) {
		const list = categories[perm.resource] ?? [];
		list.push(perm);
		categories[perm.resource] = list;
	}

	return c.json({
		permissions: allPermissions,
		categories,
	});
});

export default route;
