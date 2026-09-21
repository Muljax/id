import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import {
	securityHeaders,
	sensitiveCacheControl,
} from "../src/middleware/security";

describe("API Security Headers & Cache-Control Middleware", () => {
	test("securityHeaders sets all defense-in-depth headers on responses", async () => {
		const app = new Hono();
		app.use("*", securityHeaders());
		app.get("/test", (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(200);
		expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(res.headers.get("X-Frame-Options")).toBe("DENY");
		expect(res.headers.get("Referrer-Policy")).toBe(
			"strict-origin-when-cross-origin",
		);
		expect(res.headers.get("Strict-Transport-Security")).toBe(
			"max-age=31536000; includeSubDomains; preload",
		);
		expect(res.headers.get("Content-Security-Policy")).toBe(
			"default-src 'none'; frame-ancestors 'none'",
		);
		expect(res.headers.get("X-XSS-Protection")).toBe("0");
	});

	test("sensitiveCacheControl sets no-store and no-cache by default", async () => {
		const app = new Hono();
		app.use("*", sensitiveCacheControl());
		app.get("/api/auth/me", (c) => c.json({ user: "alice" }));

		const res = await app.request("/api/auth/me");
		expect(res.status).toBe(200);
		expect(res.headers.get("Cache-Control")).toBe(
			"no-store, no-cache, must-revalidate, private",
		);
		expect(res.headers.get("Pragma")).toBe("no-cache");
		expect(res.headers.get("Expires")).toBe("0");
	});

	test("sensitiveCacheControl does not overwrite custom Cache-Control header if already present", async () => {
		const app = new Hono();
		app.use("*", sensitiveCacheControl());
		app.get("/avatar", (c) => {
			c.header("Cache-Control", "public, max-age=86400");
			return c.text("image-data");
		});

		const res = await app.request("/avatar");
		expect(res.status).toBe(200);
		expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");
		expect(res.headers.get("Pragma")).toBeNull();
	});
});
