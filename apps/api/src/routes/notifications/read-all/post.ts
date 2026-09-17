import { and, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { notifications } from "@/db/schema";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireAuth } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post("/", requireAuth, async (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const canManageAdminNotifications =
		roles.includes("admin") ||
		hasPermission(permissions, "notifications:write");
	const db = createDb(c.env.DB);

	const targetConditions = [
		eq(notifications.userId, user.id),
		eq(notifications.target, "all"),
	];

	if (canManageAdminNotifications) {
		targetConditions.push(eq(notifications.target, "admins"));
	}

	await db
		.update(notifications)
		.set({ readAt: Date.now() })
		.where(and(or(...targetConditions), isNull(notifications.readAt)));

	return c.json({ success: true });
});

export default route;
