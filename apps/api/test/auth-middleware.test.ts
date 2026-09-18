import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import type { AppEnv } from "../src/middleware/auth";
import {
	requireSessionAuth,
	requireSessionOrPermission,
} from "../src/middleware/auth";

describe("Auth Middleware & Scope Attenuation Protection", () => {
	test("requireSessionAuth allows interactive cookie sessions", async () => {
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
			c.set("roles", ["user"]);
			c.set("permissions", new Set(["ssh:keys:manage"]));
			c.set("authMethod", "session");
			await next();
		});
		app.patch("/account/profile", requireSessionAuth, (c) =>
			c.json({ ok: true }),
		);

		const res = await app.request("/account/profile", { method: "PATCH" });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
	});

	test("requireSessionAuth rejects OAuth bearer tokens with standard read-only scopes", async () => {
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
			c.set("roles", ["user"]);
			c.set("permissions", new Set(["openid", "profile", "email"]));
			c.set("authMethod", "oauth");
			c.set("tokenScopes", new Set(["openid", "profile", "email"]));
			await next();
		});
		app.patch("/account/profile", requireSessionAuth, (c) =>
			c.json({ ok: true }),
		);

		const res = await app.request("/account/profile", { method: "PATCH" });
		expect(res.status).toBe(403);
		const body = (await res.json()) as { error: string; message: string };
		expect(body.error).toBe("forbidden");
		expect(body.message).toContain(
			"Account management requires an interactive user session",
		);
	});

	test("requireSessionAuth rejects OAuth bearer tokens with ssh:keys:manage scope", async () => {
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
			c.set("roles", ["user"]);
			c.set(
				"permissions",
				new Set(["ssh:keys:manage", "ssh:cert:issue", "ssh:ca:read"]),
			);
			c.set("authMethod", "oauth");
			c.set("tokenScopes", new Set(["ssh:keys:manage"]));
			await next();
		});
		app.patch("/account/profile", requireSessionAuth, (c) =>
			c.json({ ok: true }),
		);

		const res = await app.request("/account/profile", { method: "PATCH" });
		expect(res.status).toBe(403);
	});

	test("requireSessionAuth permits OAuth bearer tokens with explicit users:write scope", async () => {
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
			c.set("roles", ["user"]);
			c.set("permissions", new Set(["users:write"]));
			c.set("authMethod", "oauth");
			c.set("tokenScopes", new Set(["users:write"]));
			await next();
		});
		app.patch("/account/profile", requireSessionAuth, (c) =>
			c.json({ ok: true }),
		);

		const res = await app.request("/account/profile", { method: "PATCH" });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
	});

	test("requireSessionOrPermission allows session or matching OAuth scopes", async () => {
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
			const authHeader = c.req.header("Authorization");
			if (authHeader === "Bearer notification-token") {
				c.set("authMethod", "oauth");
				c.set("permissions", new Set(["notifications:read"]));
			} else if (authHeader === "Bearer openid-token") {
				c.set("authMethod", "oauth");
				c.set("permissions", new Set(["openid", "profile"]));
			} else {
				c.set("authMethod", "session");
				c.set("permissions", new Set());
			}
			await next();
		});

		app.get(
			"/notifications",
			requireSessionOrPermission("notifications:read", "notifications:*", "*"),
			(c) => c.json({ ok: true }),
		);

		// Cookie session -> OK
		const sessionRes = await app.request("/notifications");
		expect(sessionRes.status).toBe(200);

		// Token with notifications:read -> OK
		const validTokenRes = await app.request("/notifications", {
			headers: { Authorization: "Bearer notification-token" },
		});
		expect(validTokenRes.status).toBe(200);

		// Token with only openid/profile -> 403 Forbidden
		const invalidTokenRes = await app.request("/notifications", {
			headers: { Authorization: "Bearer openid-token" },
		});
		expect(invalidTokenRes.status).toBe(403);
	});
});
