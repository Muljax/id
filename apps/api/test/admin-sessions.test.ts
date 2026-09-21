import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import * as schema from "../src/db/schema";
import {
	deleteAllSessions,
	getUserSession,
	getUserSessions,
} from "../src/lib/session";
import { SYSTEM_ROLE_IDS } from "../src/lib/rbac/constants";
import type { AppEnv } from "../src/middleware/auth";
import { requirePermission } from "../src/middleware/auth";
import { createTestDb } from "./helpers/db";

function createInMemoryDb() {
	return createTestDb().db;
}

describe("Admin User Sessions Management & RBAC", () => {
	test("getUserSessions retrieves active sessions and filters expired ones", async () => {
		const db = createInMemoryDb();
		const now = Date.now();

		await db.insert(schema.users).values({
			id: "user-target",
			email: "target@example.com",
			passwordHash: "dummy-hash",
			createdAt: now,
			updatedAt: now,
		});

		await db.insert(schema.sessions).values([
			{
				id: "session-1",
				userId: "user-target",
				tokenHash: "hash-1",
				ipAddress: "1.2.3.4",
				country: "US",
				city: "New York",
				browser: "Chrome",
				os: "macOS",
				expiresAt: now + 3600000,
				createdAt: now,
			},
			{
				id: "session-2",
				userId: "user-target",
				tokenHash: "hash-2",
				ipAddress: "5.6.7.8",
				country: "CA",
				city: "Toronto",
				browser: "Firefox",
				os: "Linux",
				expiresAt: now + 3600000,
				createdAt: now,
			},
			{
				id: "session-expired",
				userId: "user-target",
				tokenHash: "hash-expired",
				expiresAt: now - 3600000,
				createdAt: now - 7200000,
			},
		]);

		const sessions = await getUserSessions(db as never, "user-target");
		expect(sessions).toHaveLength(2);
		expect(sessions.map((s) => s.id)).toEqual(["session-1", "session-2"]);
	});

	test("getUserSession returns session if owned by target user, null otherwise", async () => {
		const db = createInMemoryDb();
		const now = Date.now();

		await db.insert(schema.users).values({
			id: "user-1",
			email: "user1@example.com",
			passwordHash: "dummy-hash",
			createdAt: now,
			updatedAt: now,
		});

		await db.insert(schema.sessions).values({
			id: "session-1",
			userId: "user-1",
			tokenHash: "hash-1",
			expiresAt: now + 3600000,
			createdAt: now,
		});

		const session = await getUserSession(db as never, "user-1", "session-1");
		expect(session).not.toBeNull();
		expect(session?.id).toBe("session-1");

		const wrongUserSession = await getUserSession(
			db as never,
			"user-other",
			"session-1",
		);
		expect(wrongUserSession).toBeNull();
	});

	test("deleteAllSessions deletes all active sessions for target user", async () => {
		const db = createInMemoryDb();
		const now = Date.now();

		await db.insert(schema.users).values({
			id: "user-1",
			email: "user1@example.com",
			passwordHash: "dummy-hash",
			createdAt: now,
			updatedAt: now,
		});

		await db.insert(schema.sessions).values([
			{
				id: "session-1",
				userId: "user-1",
				tokenHash: "hash-1",
				expiresAt: now + 3600000,
				createdAt: now,
			},
			{
				id: "session-2",
				userId: "user-1",
				tokenHash: "hash-2",
				expiresAt: now + 3600000,
				createdAt: now,
			},
		]);

		await deleteAllSessions(db as never, "user-1");

		const remaining = await db
			.select()
			.from(schema.sessions)
			.where(eq(schema.sessions.userId, "user-1"));

		expect(remaining).toHaveLength(0);
	});

	test("requirePermission('users:read') restricts session listing without permission", async () => {
		const app = new Hono<AppEnv>();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: "user-1",
				email: "user@example.com",
				passwordHash: "dummy-hash",
				displayName: "User",
				givenName: null,
				familyName: null,
				middleName: null,
				nickname: null,
				preferredUsername: null,
				profileUrl: null,
				profileImageKey: null,
				website: null,
				gender: null,
				birthdate: null,
				zoneinfo: null,
				locale: null,
				emailVerifiedAt: null,
				disabledAt: null,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			c.set("roles", [SYSTEM_ROLE_IDS.USER]);
			c.set("permissions", new Set(["settings:read"]));
			await next();
		});

		app.get(
			"/admin/users/:userId/sessions",
			requirePermission("users:read"),
			(c) => c.json({ ok: true }),
		);

		const res = await app.request("/admin/users/target/sessions");
		expect(res.status).toBe(403);
	});

	test("requirePermission('users:write') restricts session revocation without permission", async () => {
		const app = new Hono<AppEnv>();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: "user-1",
				email: "user@example.com",
				passwordHash: "dummy-hash",
				displayName: "User",
				givenName: null,
				familyName: null,
				middleName: null,
				nickname: null,
				preferredUsername: null,
				profileUrl: null,
				profileImageKey: null,
				website: null,
				gender: null,
				birthdate: null,
				zoneinfo: null,
				locale: null,
				emailVerifiedAt: null,
				disabledAt: null,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			c.set("roles", [SYSTEM_ROLE_IDS.USER]);
			c.set("permissions", new Set(["users:read"]));
			await next();
		});

		app.post(
			"/admin/users/:userId/sessions/:sessionId/revoke",
			requirePermission("users:write"),
			(c) => c.json({ ok: true }),
		);

		const res = await app.request(
			"/admin/users/target/sessions/session-1/revoke",
			{
				method: "POST",
			},
		);
		expect(res.status).toBe(403);
	});
});
