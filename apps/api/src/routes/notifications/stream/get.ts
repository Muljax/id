import { and, asc, eq, gt, or } from "drizzle-orm";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { notifications } from "@/db/schema";
import { notificationBus } from "@/lib/notifications/bus";
import type { NotificationPayload } from "@/lib/notifications/types";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireSessionOrPermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";

export const streamNotificationsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Notifications & Events"],
	summary: "Subscribe to live notification stream (SSE)",
	description:
		"Open Server-Sent Events stream for real-time notification dispatch and keepalive heartbeats.",
	responses: {
		200: {
			content: {
				"text/event-stream": {
					schema: z.string().openapi({
						description: "Server-Sent Events text stream",
					}),
				},
			},
			description: "SSE stream connection established",
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

route.openapi(streamNotificationsRoute, (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const canAccessAdminNotifications =
		roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
		hasPermission(permissions, "notifications:read");

	const db = createDb(c.env.DB);
	const encoder = new TextEncoder();

	let unsubscribe: (() => void) | null = null;
	let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let isClosed = false;

	const targetConditions = [
		eq(notifications.userId, user.id),
		eq(notifications.target, "all"),
	];

	if (canAccessAdminNotifications) {
		targetConditions.push(eq(notifications.target, "admins"));
	}

	const baseCondition = or(...targetConditions);
	const sentNotificationIds = new Set<string>();
	let lastCheckedTimestamp = Date.now() - 1000;

	const stream = new ReadableStream({
		start(controller) {
			const cleanup = () => {
				if (isClosed) return;
				isClosed = true;
				if (unsubscribe) unsubscribe();
				if (heartbeatInterval) clearInterval(heartbeatInterval);
				if (pollInterval) clearInterval(pollInterval);
			};

			const sendEvent = (event: string, data: unknown, id?: string) => {
				if (isClosed) return;
				try {
					let payload = "";
					if (id) {
						payload += `id: ${id}\n`;
					}
					payload += `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
					controller.enqueue(encoder.encode(payload));
				} catch {
					cleanup();
				}
			};

			sendEvent("connected", { ok: true, timestamp: Date.now() });

			heartbeatInterval = setInterval(() => {
				if (isClosed) return;
				try {
					controller.enqueue(encoder.encode(": keepalive\n\n"));
				} catch {
					cleanup();
				}
			}, 20000);

			unsubscribe = notificationBus.subscribe(
				(notification: NotificationPayload) => {
					if (isClosed) return;

					const isTargetedToUser = notification.userId === user.id;
					const isBroadcast = notification.target === "all";
					const isAdminTargeted =
						canAccessAdminNotifications && notification.target === "admins";

					if (!isTargetedToUser && !isBroadcast && !isAdminTargeted) {
						return;
					}

					if (sentNotificationIds.has(notification.id)) {
						return;
					}

					sentNotificationIds.add(notification.id);
					if (notification.createdAt > lastCheckedTimestamp) {
						lastCheckedTimestamp = notification.createdAt;
					}

					sendEvent("notification", notification, notification.id);
				},
			);

			pollInterval = setInterval(async () => {
				if (isClosed) return;

				try {
					const newItems = await db
						.select()
						.from(notifications)
						.where(
							and(
								baseCondition,
								gt(notifications.createdAt, lastCheckedTimestamp),
							),
						)
						.orderBy(asc(notifications.createdAt))
						.limit(20);

					for (const item of newItems) {
						if (sentNotificationIds.has(item.id)) {
							continue;
						}

						sentNotificationIds.add(item.id);
						if (item.createdAt > lastCheckedTimestamp) {
							lastCheckedTimestamp = item.createdAt;
						}

						const payload: NotificationPayload = {
							id: item.id,
							target: item.target as NotificationPayload["target"],
							userId: item.userId,
							type: item.type,
							category: item.category as NotificationPayload["category"],
							severity: item.severity as NotificationPayload["severity"],
							title: item.title,
							message: item.message,
							actionUrl: item.actionUrl,
							data: item.data,
							readAt: item.readAt,
							createdAt: item.createdAt,
						};

						sendEvent("notification", payload, item.id);
					}
				} catch {
					// Ignore transient D1 read errors during stream
				}
			}, 2500);
		},
		cancel() {
			if (isClosed) return;
			isClosed = true;
			if (unsubscribe) unsubscribe();
			if (heartbeatInterval) clearInterval(heartbeatInterval);
			if (pollInterval) clearInterval(pollInterval);
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	});
});

export default route;
