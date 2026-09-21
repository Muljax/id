import { and, desc, eq, isNull, or } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { notifications } from "@/db/schema";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireSessionOrPermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import { NotificationsListResponseSchema } from "@/schemas/notifications";

export const getNotificationsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Notifications & Events"],
	summary: "List user and administrative notifications",
	description:
		"Retrieve notification feed and total unread counter for the caller.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: NotificationsListResponseSchema,
				},
			},
			description: "Notification feed and unread count",
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
	requireSessionOrPermission("notifications:read", "notifications:*", "*"),
);

route.openapi(getNotificationsRoute, async (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const canAccessAdminNotifications =
		roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
		hasPermission(permissions, "notifications:read");
	const db = createDb(c.env.DB);

	const targetConditions = [
		eq(notifications.userId, user.id),
		eq(notifications.target, "all"),
	];

	if (canAccessAdminNotifications) {
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

	return c.json(
		{
			notifications: items.map((item) => ({
				...item,
				target: item.target as "user" | "admins" | "all",
				category: item.category as "general" | "security" | "auth" | "admin",
				severity: item.severity as "info" | "success" | "warning" | "error",
			})),
			unreadCount: unreadItems.length,
		},
		200,
	);
});

export default route;
