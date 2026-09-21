import type { Database } from "@/db";
import { notifications } from "@/db/schema";
import { notificationBus } from "./bus";
import type { EmitNotificationOptions, NotificationPayload } from "./types";

export async function emitNotification(
	db: Database,
	options: EmitNotificationOptions,
): Promise<NotificationPayload> {
	const now = Date.now();
	const id = crypto.randomUUID();
	const target = options.target ?? (options.userId ? "user" : "all");
	const category = options.category ?? "general";
	const severity = options.severity ?? "info";
	const data = options.data ? JSON.stringify(options.data) : null;

	const [record] = await db
		.insert(notifications)
		.values({
			id,
			target,
			userId: options.userId ?? null,
			type: options.type,
			category,
			severity,
			title: options.title,
			message: options.message,
			actionUrl: options.actionUrl ?? null,
			data,
			readAt: null,
			createdAt: now,
		})
		.returning();

	const payload: NotificationPayload = {
		id: record.id,
		target: record.target as NotificationPayload["target"],
		userId: record.userId,
		type: record.type,
		category: record.category as NotificationPayload["category"],
		severity: record.severity as NotificationPayload["severity"],
		title: record.title,
		message: record.message,
		actionUrl: record.actionUrl,
		data: record.data,
		readAt: record.readAt,
		createdAt: record.createdAt,
	};

	notificationBus.broadcast(payload);

	return payload;
}
