import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

import { csrfProtection } from "../src/middleware/csrf";
import type { AppEnv } from "../src/middleware/auth";

describe("Universal CSRF & Cross-Site Origin Protection Middleware", () => {
	const createTestApp = (
		dashboardDomain = "id.muljax.dev",
		localhost = "false",
	) => {
		const app = new Hono<AppEnv>();
		app.use("*", csrfProtection);
		app.post("/test-mutation", (c) => c.json({ ok: true }));
		app.get("/test-query", (c) => c.json({ ok: true }));

		const env = {
			DASHBOARD_DOMAIN: dashboardDomain,
			LOCALHOST: localhost,
		} as unknown as Env;

		return { app, env };
	};

	test("allows safe GET requests regardless of origin or session", async () => {
		const { app, env } = createTestApp();
		const res = await app.request(
			"/test-query",
			{
				method: "GET",
				headers: {
					Cookie: "session=test_session_token",
					Origin: "https://evil.com",
					"Sec-Fetch-Site": "cross-site",
				},
			},
			env,
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as Record<string, unknown>;
		expect(json.ok).toBe(true);
	});

	test("allows state-modifying requests using OAuth Bearer tokens without cookies", async () => {
		const { app, env } = createTestApp();
		const res = await app.request(
			"/test-mutation",
			{
				method: "POST",
				headers: {
					Authorization: "Bearer test_oauth_access_token",
					Origin: "https://cli.internal",
				},
			},
			env,
		);

		expect(res.status).toBe(200);
	});

	test("blocks cross-site request even if attacker supplies dummy Authorization header alongside session cookie", async () => {
		const { app, env } = createTestApp();
		const res = await app.request(
			"/test-mutation",
			{
				method: "POST",
				headers: {
					Authorization: "Bearer fake_token",
					Cookie: "session=test_session_token",
					Origin: "https://evil.com",
					"Sec-Fetch-Site": "cross-site",
				},
			},
			env,
		);

		expect(res.status).toBe(403);
		const json = (await res.json()) as Record<string, unknown>;
		expect(json.error).toBe("access_denied");
	});

	test("blocks session mutation when Sec-Fetch-Site is cross-site", async () => {
		const { app, env } = createTestApp();
		const res = await app.request(
			"/test-mutation",
			{
				method: "POST",
				headers: {
					Cookie: "session=test_session_token",
					"Sec-Fetch-Site": "cross-site",
				},
			},
			env,
		);

		expect(res.status).toBe(403);
		const json = (await res.json()) as Record<string, unknown>;
		expect(json.error).toBe("access_denied");
		expect(json.error_description).toBe("Cross-site request blocked.");
	});

	test("blocks session mutation when Origin does not match dashboard", async () => {
		const { app, env } = createTestApp();
		const res = await app.request(
			"/test-mutation",
			{
				method: "POST",
				headers: {
					Cookie: "session=test_session_token",
					Origin: "https://evil-attacker.com",
				},
			},
			env,
		);

		expect(res.status).toBe(403);
		const json = (await res.json()) as Record<string, unknown>;
		expect(json.error).toBe("access_denied");
		expect(json.error_description).toBe("Invalid request origin.");
	});

	test("allows session mutation when Origin matches authorized dashboard", async () => {
		const { app, env } = createTestApp();
		const res = await app.request(
			"/test-mutation",
			{
				method: "POST",
				headers: {
					Cookie: "session=test_session_token",
					Origin: "https://id.muljax.dev",
					"Sec-Fetch-Site": "same-site",
				},
			},
			env,
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as Record<string, unknown>;
		expect(json.ok).toBe(true);
	});

	test("allows local development origins when LOCALHOST is true", async () => {
		const { app, env } = createTestApp("id.muljax.dev", "true");
		const res = await app.request(
			"/test-mutation",
			{
				method: "POST",
				headers: {
					Cookie: "session=test_session_token",
					Origin: "http://localhost:5173",
				},
			},
			env,
		);

		expect(res.status).toBe(200);
	});
});
