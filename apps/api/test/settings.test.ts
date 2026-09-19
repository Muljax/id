import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { SYSTEM_ROLE_IDS } from "../src/lib/rbac/constants";
import type { AppEnv } from "../src/middleware/auth";
import { requirePermission } from "../src/middleware/auth";

describe("Settings & Signup Policy", () => {
	test("requirePermission('settings:read') restricts access without permission", async () => {
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

		app.get("/admin/settings", requirePermission("settings:read"), (c) =>
			c.json({ ok: true }),
		);

		const res = await app.request("/admin/settings");
		expect(res.status).toBe(403);
	});

	test("requirePermission('settings:read') permits access with settings:read or wildcard", async () => {
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
			c.set("permissions", new Set(["settings:read"]));
			await next();
		});

		app.get("/admin/settings", requirePermission("settings:read"), (c) =>
			c.json({
				settings: {
					id: 1,
					signupMode: "enabled",
					signinMode: "enabled",
				},
			}),
		);

		const res = await app.request("/admin/settings");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { settings: { signupMode: string } };
		expect(body.settings.signupMode).toBe("enabled");
	});

	test("requirePermission('settings:write') permits update only with settings:write or wildcard", async () => {
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

		app.patch("/admin/settings", requirePermission("settings:write"), (c) =>
			c.json({
				settings: {
					id: 1,
					signupMode: "invite",
					signinMode: "enabled",
				},
			}),
		);

		const res = await app.request("/admin/settings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ signupMode: "invite" }),
		});
		expect(res.status).toBe(200);
		const body = (await res.json()) as { settings: { signupMode: string } };
		expect(body.settings.signupMode).toBe("invite");
	});

	test("OAuth lockdown rejects non-admin authorization approval when signinMode is disabled or admin_key", async () => {
		const app = new Hono<AppEnv>();

		// Helper mimicking approve route with signinMode checks
		app.post("/oauth/approve", async (c) => {
			const body = (await c.req.json()) as { signinMode: string; isAdmin: boolean };
			if (body.signinMode === "disabled") {
				return c.json(
					{
						error: "temporarily_unavailable",
						error_description: "Authentication and OAuth authorizations are currently disabled on this instance.",
					},
					503,
				);
			}
			if (body.signinMode === "admin_key" && !body.isAdmin) {
				return c.json(
					{
						error: "access_denied",
						error_description: "Maintenance mode active: Approving OAuth authorizations requires administrator privileges.",
					},
					403,
				);
			}
			return c.json({ redirect_uri: "https://example.com/callback?code=test-code" });
		});

		// Disabled mode: rejects with 503 temporarily_unavailable
		const resDisabled = await app.request("/oauth/approve", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ signinMode: "disabled", isAdmin: false }),
		});
		expect(resDisabled.status).toBe(503);
		const bodyDisabled = (await resDisabled.json()) as { error: string };
		expect(bodyDisabled.error).toBe("temporarily_unavailable");

		// admin_key mode with non-admin: rejects with 403 access_denied
		const resAdminKeyUser = await app.request("/oauth/approve", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ signinMode: "admin_key", isAdmin: false }),
		});
		expect(resAdminKeyUser.status).toBe(403);
		const bodyAdminKeyUser = (await resAdminKeyUser.json()) as { error: string };
		expect(bodyAdminKeyUser.error).toBe("access_denied");

		// admin_key mode with admin: succeeds
		const resAdminKeyAdmin = await app.request("/oauth/approve", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ signinMode: "admin_key", isAdmin: true }),
		});
		expect(resAdminKeyAdmin.status).toBe(200);
	});
});
