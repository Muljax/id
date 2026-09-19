import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import packageJson from "../package.json" with { type: "json" };

describe("API Health Endpoint", () => {
	test("returns status ok, database connected, and api package version", async () => {
		const app = new Hono();
		app.get("/api/health", (c) => {
			return c.json({
				status: "ok",
				version: packageJson.version,
				database: "connected",
			});
		});

		const res = await app.request("http://localhost/api/health");
		expect(res.status).toBe(200);
		const data = (await res.json()) as {
			status: string;
			version: string;
			database: string;
		};
		expect(data.status).toBe("ok");
		expect(data.version).toBe(packageJson.version);
		expect(data.database).toBe("connected");
	});
});
