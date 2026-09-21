import { and, eq, isNull, or } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { notifications } from "@/db/schema";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireSessionOrPermission } from "@/middleware/auth";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

export const markAllNotificationsReadRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Notifications & Events"],
	summary: "Mark all notifications as read",
	description: "Update all unread notifications to read status for the caller.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "All notifications marked as read",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use(
	"/*",
	requireSessionOrPermission("notifications:write", "notifications:*", "*"),
);

route.openapi(markAllNotificationsReadRoute, async (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const canManageAdminNotifications =
		roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
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

	return c.json({ success: true }, 200);
});

export default route;
