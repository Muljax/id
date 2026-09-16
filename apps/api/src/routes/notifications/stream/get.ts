import { Hono } from "hono";

import { notificationBus } from "@/lib/notifications/bus";
import type { NotificationPayload } from "@/lib/notifications/types";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireAuth } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requireAuth, (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const isAdmin = roles.includes("admin") || hasPermission(permissions, "*");

	const encoder = new TextEncoder();

	let unsubscribe: (() => void) | null = null;
	let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

	const stream = new ReadableStream({
		start(controller) {
			// Send initial connected event
			controller.enqueue(
				encoder.encode(
					`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`,
				),
			);

			// Send periodic keepalive ping
			heartbeatInterval = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(": keepalive\n\n"));
				} catch {
					// Stream closed
					if (heartbeatInterval) clearInterval(heartbeatInterval);
				}
			}, 25000);

			unsubscribe = notificationBus.subscribe(
				(notification: NotificationPayload) => {
					// Check audience match
					const isTargetedToUser = notification.userId === user.id;
					const isBroadcast = notification.target === "all";
					const isAdminTargeted = isAdmin && notification.target === "admins";

					if (!isTargetedToUser && !isBroadcast && !isAdminTargeted) {
						return;
					}

					try {
						controller.enqueue(
							encoder.encode(
								`event: notification\ndata: ${JSON.stringify(notification)}\n\n`,
							),
						);
					} catch {
						// Stream closed
						if (unsubscribe) unsubscribe();
						if (heartbeatInterval) clearInterval(heartbeatInterval);
					}
				},
			);
		},
		cancel() {
			if (unsubscribe) unsubscribe();
			if (heartbeatInterval) clearInterval(heartbeatInterval);
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
});

export default route;
