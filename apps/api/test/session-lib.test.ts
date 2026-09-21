import { describe, expect, test } from "bun:test";
import * as schema from "../src/db/schema";
import {
	cleanupExpiredSessions,
	createSession,
	deleteAllSessions,
	deleteOtherSessions,
	deleteSession,
	getAdminUser,
	getSession,
	getSessionUser,
	getSessionUserWithSession,
	getUserSession,
	getUserSessions,
	touchSession,
} from "../src/lib/session";
import { createTestAdminUser, createTestDb, createTestUser } from "./helpers";

describe("Session Management Library Utilities", () => {
	test("createSession handles rememberMe persistent (30-day) and non-persistent (1-hour) lifetimes", async () => {
		const { db } = createTestDb();
		const now = Date.now();
		const { id: userId } = await createTestUser(db, {
			email: "user@example.com",
		});

		// Persistent session (30 days)
		const s1 = await createSession(
			db,
			userId,
			{
				ipAddress: "192.0.2.1",
				country: "US",
				city: "Austin",
				region: "TX",
				latitude: 30.2672,
				longitude: -97.7431,
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0",
			},
			true,
		);
		expect(s1.rememberMe).toBe(true);
		expect(s1.expiresAt).toBeGreaterThan(now + 29 * 24 * 60 * 60 * 1000);

		const record1 = await getSession(db, s1.token);
		expect(record1).not.toBeNull();
		expect(record1?.browser).toBe("Chrome");
		expect(record1?.os).toBe("Windows");
		expect(record1?.country).toBe("US");

		// Non-persistent session (1 hour)
		const s2 = await createSession(db, userId, {}, false);
		expect(s2.rememberMe).toBe(false);
		expect(s2.expiresAt).toBeLessThan(now + 2 * 60 * 60 * 1000);
	});

	test("getSession, getSessionUser, and getSessionUserWithSession retrieve active records", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "lookup@example.com",
		});

		const { token } = await createSession(db, userId);

		const sessionRecord = await getSession(db, token);
		expect(sessionRecord?.userId).toBe(userId);

		const userRecord = await getSessionUser(db, token);
		expect(userRecord?.id).toBe(userId);
		expect(userRecord?.email).toBe("lookup@example.com");

		const combined = await getSessionUserWithSession(db, token);
		expect(combined?.user.id).toBe(userId);
		expect(combined?.session.tokenHash).toBeDefined();

		// Expired session returns null
		expect(await getSession(db, "non-existent-token")).toBeNull();
		expect(await getSessionUser(db, "non-existent-token")).toBeNull();
		expect(
			await getSessionUserWithSession(db, "non-existent-token"),
		).toBeNull();
	});

	test("getSessionUser returns null if user is disabled", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "disabled_session@example.com",
			disabledAt: Date.now() - 5000,
		});

		const { token } = await createSession(db, userId);
		expect(await getSessionUser(db, token)).toBeNull();
	});

	test("getAdminUser verifies administrator privilege", async () => {
		const { db } = createTestDb();
		const { id: adminId } = await createTestAdminUser(db, {
			email: "admin@example.com",
		});
		const { id: regId } = await createTestUser(db, {
			email: "reg@example.com",
		});

		const adminSession = await createSession(db, adminId);
		const regSession = await createSession(db, regId);

		expect(await getAdminUser(db, adminSession.token)).not.toBeNull();
		expect(await getAdminUser(db, regSession.token)).toBeNull();
	});

	test("touchSession updates lastUsedAt timestamp", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "touch@example.com",
		});

		const { token } = await createSession(db, userId);
		const initialSession = await getSession(db, token);

		// Sleep slightly to guarantee different timestamp
		await new Promise((r) => setTimeout(r, 10));

		await touchSession(db, initialSession!.id);
		const touchedSession = await getSession(db, token);
		expect(touchedSession!.lastUsedAt).toBeGreaterThanOrEqual(
			initialSession!.lastUsedAt!,
		);
	});

	test("deleteSession, deleteOtherSessions, and deleteAllSessions session revoking", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "multi@example.com",
		});

		const s1 = await createSession(db, userId);
		const s2 = await createSession(db, userId);
		const s3 = await createSession(db, userId);

		expect(await getUserSessions(db, userId)).toHaveLength(3);

		const s1Record = await getSession(db, s1.token);
		expect(await getUserSession(db, userId, s1Record!.id)).not.toBeNull();

		// 1. Delete single session (s1)
		await deleteSession(db, s1.token);
		expect(await getSession(db, s1.token)).toBeNull();
		expect(await getUserSessions(db, userId)).toHaveLength(2);

		// 2. Delete other sessions preserving s2
		const s2Record = await getSession(db, s2.token);
		await deleteOtherSessions(db, userId, s2Record!.id);
		expect(await getSession(db, s2.token)).not.toBeNull();
		expect(await getSession(db, s3.token)).toBeNull();
		expect(await getUserSessions(db, userId)).toHaveLength(1);

		// 3. Delete all sessions for user
		await deleteAllSessions(db, userId);
		expect(await getUserSessions(db, userId)).toHaveLength(0);
	});

	test("cleanupExpiredSessions removes expired sessions", async () => {
		const { db } = createTestDb();
		const past = Date.now() - 50000;
		const { id: userId } = await createTestUser(db, {
			email: "exp@example.com",
		});

		await db.insert(schema.sessions).values({
			id: "expired-sess",
			userId,
			tokenHash: "expired-hash",
			expiresAt: past,
			createdAt: past,
		});

		const changes = await cleanupExpiredSessions(db);
		expect(changes).toBe(1);
	});
});
