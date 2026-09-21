import { and, eq, or } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { notifications } from "@/db/schema";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireSessionOrPermission } from "@/middleware/auth";
import {
	ErrorResponseSchema,
	IdParamSchema,
	SuccessResponseSchema,
} from "@/schemas/common";

export const markNotificationReadRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Notifications & Events"],
	summary: "Mark notification as read",
	description: "Set read timestamp on specific notification record.",
	request: {
		params: IdParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Notification marked as read",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Notification not found",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use(
	"/*",
	requireSessionOrPermission("notifications:write", "notifications:*", "*"),
);

route.openapi(markNotificationReadRoute, async (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const canManageAdminNotifications =
		roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
		hasPermission(permissions, "notifications:write");
	const { id } = c.req.valid("param");

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

	return c.json({ success: true }, 200);
});

export default route;
