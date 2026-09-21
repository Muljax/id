import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import * as schema from "../src/db/schema";
import { elevateSession, getSessionUserWithSession } from "../src/lib/session";
import type { AppEnv } from "../src/middleware/auth";
import {
	authenticate,
	requireElevatedSession,
	requireStrictSessionAuth,
} from "../src/middleware/auth";
import elevateRoutes from "../src/routes/auth/elevate";
import {
	createTestAdminUser,
	createTestDb,
	createTestOAuthClient,
	createTestSession,
	createTestUser,
	seedTestSystemRoles,
} from "./helpers";

describe("Step-Up Authentication & Session Elevation", () => {
	test("elevateSession updates elevatedUntil timestamp on existing session", async () => {
		const { db } = createTestDb();
		const now = Date.now();

		const user = await createTestUser(db);
		const { token } = await createTestSession(db, user.id);
		const initialRecord = await getSessionUserWithSession(db, token);
		expect(initialRecord?.session.elevatedUntil).toBeNull();
		expect(initialRecord?.session.id).toBeDefined();

		const elevatedUntil = await elevateSession(
			db,
			initialRecord?.session.id ?? "",
			5 * 60 * 1000,
		);
		expect(elevatedUntil).toBeGreaterThan(now);

		const updatedRecord = await getSessionUserWithSession(db, token);
		expect(updatedRecord?.session.elevatedUntil).toBe(elevatedUntil);
	});

	test("requireElevatedSession blocks unelevated session and allows elevated session", async () => {
		const { db, d1 } = createTestDb();
		const now = Date.now();

		const user = await createTestUser(db);
		const { token } = await createTestSession(db, user.id);
		const sessionRecord = await getSessionUserWithSession(db, token);
		expect(sessionRecord?.session.id).toBeDefined();

		const app = new Hono<AppEnv>();
		app.use("*", async (c, next) => {
			c.env = { DB: d1 } as unknown as Env;
			await authenticate(c, next);
		});

		app.post(
			"/api/sensitive-action",
			requireStrictSessionAuth,
			requireElevatedSession,
			(c) => c.json({ success: true, performed: true }),
		);

		// 1. Initial attempt without elevation -> 403 STEP_UP_REQUIRED
		const res1 = await app.request("/api/sensitive-action", {
			method: "POST",
			headers: {
				Cookie: `session=${token}`,
			},
		});

		expect(res1.status).toBe(403);
		const body1 = (await res1.json()) as { code?: string };
		expect(body1.code).toBe("STEP_UP_REQUIRED");

		// 2. Elevate session
		await elevateSession(db, sessionRecord?.session.id ?? "", 60 * 1000);

		// 3. Attempt with elevated session -> 200 OK
		const res2 = await app.request("/api/sensitive-action", {
			method: "POST",
			headers: {
				Cookie: `session=${token}`,
			},
		});

		expect(res2.status).toBe(200);
		const body2 = (await res2.json()) as { success?: boolean };
		expect(body2.success).toBe(true);

		// 4. Manually expire elevation timestamp -> 403 STEP_UP_REQUIRED
		await db
			.update(schema.sessions)
			.set({ elevatedUntil: now - 1000 })
			.where(eq(schema.sessions.id, sessionRecord?.session.id ?? ""));

		const res3 = await app.request("/api/sensitive-action", {
			method: "POST",
			headers: {
				Cookie: `session=${token}`,
			},
		});

		expect(res3.status).toBe(403);
	});

	test("POST /api/auth/elevate/options and POST /api/auth/elevate/verify with password", async () => {
		const { db, d1 } = createTestDb();
		const password = "SuperSecretPassword123!";

		const user = await createTestUser(db, { password });
		const { token } = await createTestSession(db, user.id);

		const app = new Hono<{ Bindings: Env }>();
		app.use("*", async (c, next) => {
			c.env = {
				DB: d1,
				RP_ID: "localhost",
				DASHBOARD_ORIGIN: "http://localhost:5173",
			} as unknown as Env;
			await next();
		});

		app.route("/api/auth/elevate", elevateRoutes);

		// 1. Get elevate options
		const optRes = await app.request("/api/auth/elevate/options", {
			method: "POST",
			headers: {
				Cookie: `session=${token}`,
			},
		});

		expect(optRes.status).toBe(200);
		const optBody = (await optRes.json()) as {
			hasPassword?: boolean;
			hasPasskeys?: boolean;
			challengeId?: string;
		};
		expect(optBody.hasPassword).toBe(true);
		expect(optBody.hasPasskeys).toBe(false);
		expect(optBody.challengeId).toBeDefined();

		// 2. Verify with wrong password -> 401
		const failVerifyRes = await app.request("/api/auth/elevate/verify", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: `session=${token}`,
			},
			body: JSON.stringify({
				password: "WrongPassword!",
			}),
		});

		expect(failVerifyRes.status).toBe(401);

		// 3. Verify with correct password -> 200 OK and elevatedUntil set
		const successVerifyRes = await app.request("/api/auth/elevate/verify", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: `session=${token}`,
			},
			body: JSON.stringify({
				password,
			}),
		});

		expect(successVerifyRes.status).toBe(200);
		const successBody = (await successVerifyRes.json()) as {
			success?: boolean;
			elevatedUntil?: number;
		};
		expect(successBody.success).toBe(true);
		expect(typeof successBody.elevatedUntil).toBe("number");
		expect(successBody.elevatedUntil ?? 0).toBeGreaterThan(Date.now());

		// Verify session in DB now has elevatedUntil
		const updatedSession = await getSessionUserWithSession(db, token);
		expect(updatedSession?.session.elevatedUntil).toBe(
			successBody.elevatedUntil ?? -1,
		);
	});

	test("DELETE /api/oauth/clients/:id requires step-up elevation", async () => {
		const { db, d1 } = createTestDb();

		// Seed system roles/permissions (wires * wildcard to admin role)
		await seedTestSystemRoles(db);

		// Create admin user (gets admin role → * wildcard permission)
		const admin = await createTestAdminUser(db);

		// Create test OAuth client
		const { client } = await createTestOAuthClient(db, {
			name: "Test Client",
			clientType: "confidential",
		});

		const { token } = await createTestSession(db, admin.id);
		const sessionRecord = await getSessionUserWithSession(db, token);

		const app = new Hono<AppEnv>();
		app.use("*", async (c, next) => {
			c.env = { DB: d1 } as unknown as Env;
			await authenticate(c, next);
		});

		const clientRoutes = (await import("../src/routes/oauth/clients")).default;
		app.route("/api/oauth/clients", clientRoutes);

		// 1. Unelevated session -> 403 STEP_UP_REQUIRED
		const res1 = await app.request(`/api/oauth/clients/${client.id}`, {
			method: "DELETE",
			headers: {
				Cookie: `session=${token}`,
			},
		});

		expect(res1.status).toBe(403);
		const body1 = (await res1.json()) as { code?: string };
		expect(body1.code).toBe("STEP_UP_REQUIRED");

		// 2. Elevate session
		await elevateSession(db, sessionRecord?.session.id ?? "", 5 * 60 * 1000);

		// 3. Elevated session -> 204 No Content
		const res2 = await app.request(`/api/oauth/clients/${client.id}`, {
			method: "DELETE",
			headers: {
				Cookie: `session=${token}`,
			},
		});

		expect(res2.status).toBe(204);

		// Verify client was deleted from DB
		const [clientAfter] = await db
			.select()
			.from(schema.oauthClients)
			.where(eq(schema.oauthClients.id, client.id));
		expect(clientAfter).toBeUndefined();
	});
});
