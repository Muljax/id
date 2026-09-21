import { describe, expect, test } from "bun:test";
import * as schema from "../src/db/schema";
import { notificationBus } from "../src/lib/notifications/bus";
import { emitNotification } from "../src/lib/notifications/emitter";
import type { NotificationPayload } from "../src/lib/notifications/types";
import { createTestDb } from "./helpers";

describe("Notification Bus & Emitter Utilities", () => {
	test("notificationBus allows subscribing, broadcasting, and unsubscribing", () => {
		const received: NotificationPayload[] = [];
		const unsubscribe = notificationBus.subscribe((payload) => {
			received.push(payload);
		});

		const testPayload: NotificationPayload = {
			id: "notif-1",
			target: "user",
			userId: "user-1",
			type: "security.test",
			category: "security",
			severity: "info",
			title: "Test Event",
			message: "This is a test notification",
			actionUrl: null,
			data: null,
			readAt: null,
			createdAt: Date.now(),
		};

		notificationBus.broadcast(testPayload);
		expect(received).toHaveLength(1);
		expect(received[0].id).toBe("notif-1");

		unsubscribe();

		notificationBus.broadcast({ ...testPayload, id: "notif-2" });
		// Should not receive notif-2 because we unsubscribed
		expect(received).toHaveLength(1);
	});

	test("notificationBus handles failing listeners gracefully without breaking other listeners", () => {
		const received: string[] = [];

		const unsub1 = notificationBus.subscribe(() => {
			throw new Error("Simulated listener crash");
		});

		const unsub2 = notificationBus.subscribe((payload) => {
			received.push(payload.id);
		});

		notificationBus.broadcast({
			id: "safe-event",
			target: "all",
			userId: null,
			type: "system.test",
			category: "system",
			severity: "warning",
			title: "Resilient Bus",
			message: "Error was handled safely",
			actionUrl: null,
			data: null,
			readAt: null,
			createdAt: Date.now(),
		});

		expect(received).toContain("safe-event");

		unsub1();
		unsub2();
	});

	test("emitNotification persists record to DB and dispatches via notificationBus", async () => {
		const { db } = createTestDb();
		const broadcasted: NotificationPayload[] = [];

		const unsubscribe = notificationBus.subscribe((payload) => {
			broadcasted.push(payload);
		});

		const result = await emitNotification(db, {
			userId: null,
			target: "admins",
			type: "admin.alert",
			category: "security",
			severity: "critical",
			title: "Admin Alert",
			message: "Critical event occurred",
			actionUrl: "/admin/security",
			data: { ip: "192.0.2.1", attempts: 5 },
		});

		expect(result.id).toBeDefined();
		expect(result.target).toBe("admins");
		expect(result.severity).toBe("critical");
		expect(result.data).toBe(JSON.stringify({ ip: "192.0.2.1", attempts: 5 }));

		// Verify database insertion
		const dbRecords = await db.select().from(schema.notifications);
		expect(dbRecords).toHaveLength(1);
		expect(dbRecords[0].title).toBe("Admin Alert");

		// Verify bus broadcast
		expect(broadcasted.some((p) => p.id === result.id)).toBe(true);

		unsubscribe();
	});

	test("emitNotification uses fallback defaults when optional fields are omitted", async () => {
		const { db } = createTestDb();

		const result = await emitNotification(db, {
			type: "user.welcome",
			title: "Welcome",
			message: "Welcome to the platform",
		});

		expect(result.target).toBe("all");
		expect(result.category).toBe("general");
		expect(result.severity).toBe("info");
		expect(result.actionUrl).toBeNull();
		expect(result.data).toBeNull();
	});
});
