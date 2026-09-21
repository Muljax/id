import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { dashboardCors, publicCors } from "../src/middleware/cors";

describe("CORS Middleware", () => {
	test("dashboardCors permits authorized dashboard domain with credentials", async () => {
		const app = new Hono<{ Bindings: Env }>();
		app.use("*", dashboardCors());
		app.get("/test", (c) => c.text("ok"));

		const env: Env = {
			DB: {} as D1Database,
			OIDC_PRIVATE_KEY: "",
			OIDC_ISSUER: "https://id.example.com",
			DASHBOARD_DOMAIN: "id.example.com",
			LOCALHOST: "false",
		};

		// 1. Authorized dashboard origin
		const res1 = await app.fetch(
			new Request("https://id.example.com/test", {
				headers: { Origin: "https://id.example.com" },
			}),
			env,
		);
		expect(res1.status).toBe(200);
		expect(res1.headers.get("Access-Control-Allow-Origin")).toBe(
			"https://id.example.com",
		);
		expect(res1.headers.get("Access-Control-Allow-Credentials")).toBe("true");

		// 2. Unauthorized origin
		const res2 = await app.fetch(
			new Request("https://id.example.com/test", {
				headers: { Origin: "https://malicious.com" },
			}),
			env,
		);
		expect(res2.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});

	test("dashboardCors allows local development origins when LOCALHOST is true", async () => {
		const app = new Hono<{ Bindings: Env }>();
		app.use("*", dashboardCors());
		app.get("/test", (c) => c.text("ok"));

		const env: Env = {
			DB: {} as D1Database,
			OIDC_PRIVATE_KEY: "",
			OIDC_ISSUER: "http://localhost:8787",
			DASHBOARD_DOMAIN: "localhost:3000",
			LOCALHOST: "true",
		};

		const res1 = await app.fetch(
			new Request("http://localhost:8787/test", {
				headers: { Origin: "http://localhost:3000" },
			}),
			env,
		);
		expect(res1.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://localhost:3000",
		);

		const res2 = await app.fetch(
			new Request("http://localhost:8787/test", {
				headers: { Origin: "http://127.0.0.1:5173" },
			}),
			env,
		);
		expect(res2.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://127.0.0.1:5173",
		);
	});

	test("publicCors permits wildcard origin without credentials", async () => {
		const app = new Hono<{ Bindings: Env }>();
		app.use("*", publicCors());
		app.get("/discovery", (c) => c.json({ ok: true }));

		const env: Env = {
			DB: {} as D1Database,
			OIDC_PRIVATE_KEY: "",
			OIDC_ISSUER: "https://id.example.com",
			DASHBOARD_DOMAIN: "id.example.com",
			LOCALHOST: "false",
		};

		const res = await app.fetch(
			new Request("https://id.example.com/discovery", {
				headers: { Origin: "https://thirdparty.com" },
			}),
			env,
		);
		expect(res.status).toBe(200);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});
});
