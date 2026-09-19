import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { SYSTEM_ROLE_IDS } from "../src/lib/rbac/constants";
import type { AppEnv } from "../src/middleware/auth";
import { requirePermission } from "../src/middleware/auth";

describe("Invite Tokens & User Creation", () => {
	test("requirePermission('users:write') restricts invite generation without write permission", async () => {
		const app = new Hono<AppEnv>();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: "user-1",
				email: "user@example.com",
				passwordHash: null,
				displayName: "Test User",
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

		app.post("/admin/invites", requirePermission("users:write"), (c) =>
			c.json({ ok: true }),
		);

		const res = await app.request("/admin/invites", { method: "POST" });
		expect(res.status).toBe(403);
	});

	test("requirePermission('users:write') permits invite generation with users:write or wildcard", async () => {
		const app = new Hono<AppEnv>();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: "admin-1",
				email: "admin@example.com",
				passwordHash: null,
				displayName: "Admin",
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
			c.set("roles", [SYSTEM_ROLE_IDS.ADMIN]);
			c.set("permissions", new Set(["users:write"]));
			await next();
		});

		app.post("/admin/invites", requirePermission("users:write"), (c) =>
			c.json({
				invite: {
					id: "invite-123",
					token: "test-token",
					roleId: "user",
					expiresAt: Date.now() + 60000,
				},
			}),
		);

		const res = await app.request("/admin/invites", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ roleId: "user" }),
		});
		expect(res.status).toBe(200);
		const body = (await res.json()) as { invite: { token: string } };
		expect(body.invite.token).toBe("test-token");
	});

	test("requirePermission('users:write') permits direct user creation with users:write or wildcard", async () => {
		const app = new Hono<AppEnv>();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: "admin-1",
				email: "admin@example.com",
				passwordHash: null,
				displayName: "Admin",
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
			c.set("roles", [SYSTEM_ROLE_IDS.ADMIN]);
			c.set("permissions", new Set(["*"]));
			await next();
		});

		app.post("/admin/users", requirePermission("users:write"), (c) =>
			c.json({
				user: {
					id: "new-user-id",
					email: "newuser@example.com",
				},
				temporaryPassword: "temp-pass-123",
			}),
		);

		const res = await app.request("/admin/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "newuser@example.com" }),
		});
		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			user: { email: string };
			temporaryPassword: string;
		};
		expect(body.user.email).toBe("newuser@example.com");
		expect(body.temporaryPassword).toBe("temp-pass-123");
	});
});
