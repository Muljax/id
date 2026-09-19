import { and, eq, or } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { notifications } from "@/db/schema";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireSessionOrPermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post(
	"/",
	requireSessionOrPermission("notifications:write", "notifications:*", "*"),
	async (c) => {
		const user = c.get("user");
		const roles = c.get("roles") ?? [];
		const permissions = c.get("permissions") ?? new Set();
		const canManageAdminNotifications =
			roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
			hasPermission(permissions, "notifications:write");
		const id = c.req.param("id");

		if (!id) {
			return c.json({ error: "Notification not found" }, 404);
		}

		const db = createDb(c.env.DB);

		const targetConditions = [
			eq(notifications.userId, user.id),
			eq(notifications.target, "all"),
		];

		if (canManageAdminNotifications) {
			targetConditions.push(eq(notifications.target, "admins"));
		}

		const result = await db
			.update(notifications)
			.set({ readAt: Date.now() })
			.where(and(eq(notifications.id, id), or(...targetConditions)))
			.returning({ id: notifications.id });

		if (result.length === 0) {
			return c.json({ error: "Notification not found" }, 404);
		}

		return c.json({ success: true });
	},
);

export default route;
