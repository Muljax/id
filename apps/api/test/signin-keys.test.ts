import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { SYSTEM_ROLE_IDS } from "../src/lib/rbac/constants";
import type { AppEnv } from "../src/middleware/auth";
import { requirePermission } from "../src/middleware/auth";

describe("Sign-in Access Keys & Sign-in Policy", () => {
	test("requirePermission('settings:read') restricts sign-in key listing without read permission", async () => {
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

		app.get("/admin/signin-keys", requirePermission("settings:read"), (c) =>
			c.json({ ok: true }),
		);

		const res = await app.request("/admin/signin-keys");
		expect(res.status).toBe(403);
	});

	test("requirePermission('settings:write') restricts sign-in key creation without write permission", async () => {
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
			c.set("permissions", new Set(["settings:read"]));
			await next();
		});

		app.post("/admin/signin-keys", requirePermission("settings:write"), (c) =>
			c.json({ ok: true }),
		);

		const res = await app.request("/admin/signin-keys", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Emergency Key" }),
		});
		expect(res.status).toBe(403);
	});

	test("requirePermission('settings:write') permits sign-in key creation with settings:write or wildcard", async () => {
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
			c.set("permissions", new Set(["settings:write"]));
			await next();
		});

		app.post("/admin/signin-keys", requirePermission("settings:write"), (c) =>
			c.json({
				key: {
					id: "key-1",
					name: "Break Glass Key",
					rawKey: "test_key_value",
					expiresAt: null,
				},
			}),
		);

		const res = await app.request("/admin/signin-keys", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Break Glass Key" }),
		});
		expect(res.status).toBe(200);
		const body = (await res.json()) as { key: { rawKey: string } };
		expect(body.key.rawKey).toBe("test_key_value");
	});

	test("requirePermission('settings:write') permits sign-in key deletion with settings:write or wildcard", async () => {
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

		app.delete(
			"/admin/signin-keys/:id",
			requirePermission("settings:write"),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/admin/signin-keys/key-1", {
			method: "DELETE",
		});
		expect(res.status).toBe(200);
		const body = (await res.json()) as { success: boolean };
		expect(body.success).toBe(true);
	});
});
