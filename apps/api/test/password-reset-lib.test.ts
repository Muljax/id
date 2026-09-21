import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import {
	consumePasswordResetToken,
	createPasswordResetToken,
	requestPasswordResetNotification,
	verifyPasswordResetToken,
} from "../src/lib/password-reset";
import { createSession, getSession } from "../src/lib/session";
import { verifyPassword } from "../src/lib/password";
import { createTestDb, createTestUser } from "./helpers";

describe("Password Reset Library Utilities", () => {
	test("createPasswordResetToken generates token and invalidates prior tokens", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "reset1@example.com",
		});

		const first = await createPasswordResetToken(db, userId);
		expect(typeof first.token).toBe("string");
		expect(first.expiresAt).toBeGreaterThan(Date.now());

		const second = await createPasswordResetToken(db, userId);

		// First token should be purged / invalid
		const verifiedFirst = await verifyPasswordResetToken(db, first.token);
		expect(verifiedFirst).toBeNull();

		// Second token is valid
		const verifiedSecond = await verifyPasswordResetToken(db, second.token);
		expect(verifiedSecond).not.toBeNull();
		expect(verifiedSecond?.userId).toBe(userId);
	});

	test("verifyPasswordResetToken returns null for expired or disabled user tokens", async () => {
		const { db } = createTestDb();
		const { id: disabledUserId } = await createTestUser(db, {
			email: "disabled@example.com",
			disabledAt: Date.now() - 5000,
		});

		const { token } = await createPasswordResetToken(db, disabledUserId);
		expect(await verifyPasswordResetToken(db, token)).toBeNull();
		expect(await verifyPasswordResetToken(db, "non-existent-token")).toBeNull();
	});

	test("consumePasswordResetToken updates password, deletes token, and terminates all active sessions", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "consume@example.com",
		});

		// Create active session
		const session = await createSession(db, userId);
		expect(await getSession(db, session.token)).not.toBeNull();

		const { token } = await createPasswordResetToken(db, userId);

		// Consume reset token
		const result = await consumePasswordResetToken(
			db,
			token,
			"NewSuperSecurePassword123!",
		);
		expect(result.success).toBe(true);
		expect(result.userId).toBe(userId);

		// Verify sessions are terminated
		expect(await getSession(db, session.token)).toBeNull();

		// Verify password was updated
		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, userId));
		expect(
			await verifyPassword("NewSuperSecurePassword123!", user.passwordHash),
		).toBe(true);

		// Token cannot be consumed twice (replay attack protection)
		expect(
			consumePasswordResetToken(db, token, "AnotherPassword!"),
		).rejects.toThrow();
	});

	test("requestPasswordResetNotification creates admin notification for active users", async () => {
		const { db } = createTestDb();
		await createTestUser(db, { email: "notify@example.com" });

		await requestPasswordResetNotification(db, "NOTIFY@example.com", {
			ipAddress: "192.0.2.1",
			userAgent: "Mozilla/5.0",
		});

		const notifs = await db.select().from(schema.notifications);
		expect(notifs).toHaveLength(1);
		expect(notifs[0].title).toBe("Password Reset Requested");
		expect(notifs[0].data).toContain("192.0.2.1");

		// Request for non-existent email does not throw and creates no notifications
		await requestPasswordResetNotification(db, "nonexistent@example.com");
		expect(await db.select().from(schema.notifications)).toHaveLength(1);
	});
});
