import { and, desc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { notifications } from "@/db/schema";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireAuth } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requireAuth, async (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const isAdmin = roles.includes("admin") || hasPermission(permissions, "*");
	const db = createDb(c.env.DB);

	const targetConditions = [
		eq(notifications.userId, user.id),
		eq(notifications.target, "all"),
	];

	if (isAdmin) {
		targetConditions.push(eq(notifications.target, "admins"));
	}

	const baseCondition = or(...targetConditions);

	const items = await db
		.select()
		.from(notifications)
		.where(baseCondition)
		.orderBy(desc(notifications.createdAt))
		.limit(50);

	const unreadItems = await db
		.select({ id: notifications.id })
		.from(notifications)
		.where(and(baseCondition, isNull(notifications.readAt)));

	return c.json({
		notifications: items,
		unreadCount: unreadItems.length,
	});
});

export default route;
