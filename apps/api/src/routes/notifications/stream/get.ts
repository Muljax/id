import { Hono } from "hono";

import { notificationBus } from "@/lib/notifications/bus";
import type { NotificationPayload } from "@/lib/notifications/types";
import { requireAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.get("/", requireAuth, (c) => {
	const user = c.get("user");
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
					const isAdminTargeted =
						user.isAdmin && notification.target === "admins";

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
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
			if (heartbeatInterval) {
				clearInterval(heartbeatInterval);
				heartbeatInterval = null;
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
		},
	});
});

export default route;
