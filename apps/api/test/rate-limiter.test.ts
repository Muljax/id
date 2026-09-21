import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

import { getClientIp, rateLimit } from "../src/middleware/rateLimiter";

describe("Cloudflare Native Rate Limiting Middleware", () => {
	const createTestApp = (
		rateLimitMock?: {
			limit: (args: { key: string }) => Promise<{ success: boolean }>;
		},
		localhost = "false",
	) => {
		const app = new Hono<{ Bindings: Env }>();

		app.use(
			"/auth/login",
			rateLimit((c) => `auth:login:${getClientIp(c)}`, {
				retryAfterSeconds: 60,
			}),
		);
		app.post("/auth/login", (c) => c.json({ ok: true }));

		const env = {
			AUTH_RATE_LIMITER: rateLimitMock,
			LOCALHOST: localhost,
		} as unknown as Env;

		return { app, env };
	};

	test("extracts client IP from CF-Connecting-IP", async () => {
		let capturedKey = "";
		const rateLimitMock = {
			limit: async ({ key }: { key: string }) => {
				capturedKey = key;
				return { success: true };
			},
		};

		const { app, env } = createTestApp(rateLimitMock);
		const res = await app.request(
			"/auth/login",
			{
				method: "POST",
				headers: {
					"CF-Connecting-IP": "203.0.113.195",
				},
			},
			env,
		);

		expect(res.status).toBe(200);
		expect(capturedKey).toBe("auth:login:203.0.113.195");
	});

	test("extracts client IP from X-Forwarded-For when CF-Connecting-IP is absent", async () => {
		let capturedKey = "";
		const rateLimitMock = {
			limit: async ({ key }: { key: string }) => {
				capturedKey = key;
				return { success: true };
			},
		};

		const { app, env } = createTestApp(rateLimitMock);
		const res = await app.request(
			"/auth/login",
			{
				method: "POST",
				headers: {
					"X-Forwarded-For": "198.51.100.4, 10.0.0.1",
				},
			},
			env,
		);

		expect(res.status).toBe(200);
		expect(capturedKey).toBe("auth:login:198.51.100.4");
	});

	test("blocks request with 429 and Retry-After header when rate limit is exceeded", async () => {
		const rateLimitMock = {
			limit: async () => ({ success: false }),
		};

		const { app, env } = createTestApp(rateLimitMock);
		const res = await app.request(
			"/auth/login",
			{
				method: "POST",
				headers: {
					"CF-Connecting-IP": "198.51.100.55",
				},
			},
			env,
		);

		expect(res.status).toBe(429);
		expect(res.headers.get("Retry-After")).toBe("60");
		const json = (await res.json()) as Record<string, unknown>;
		expect(json.error).toBe("rate_limit_exceeded");
		expect(json.error_description).toContain("60 seconds");
	});

	test("bypasses rate limiting when LOCALHOST is true", async () => {
		let called = false;
		const rateLimitMock = {
			limit: async () => {
				called = true;
				return { success: false };
			},
		};

		const { app, env } = createTestApp(rateLimitMock, "true");
		const res = await app.request(
			"/auth/login",
			{
				method: "POST",
			},
			env,
		);

		expect(res.status).toBe(200);
		expect(called).toBe(false);
	});

	test("fails open gracefully when rate limiter binding throws", async () => {
		const rateLimitMock = {
			limit: async () => {
				throw new Error("Cloudflare internal rate limiter failure");
			},
		};

		const { app, env } = createTestApp(rateLimitMock);
		const res = await app.request(
			"/auth/login",
			{
				method: "POST",
			},
			env,
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as Record<string, unknown>;
		expect(json.ok).toBe(true);
	});
});
