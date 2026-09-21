import { describe, expect, test } from "bun:test";
import packageJson from "../package.json" with { type: "json" };
import { app } from "../src/app";

describe("API Health Endpoint", () => {
	test("returns status ok, database connected, and api package version", async () => {
		const res = await app.fetch(
			new Request("http://localhost/api/health"),
			{} as Env,
			{} as ExecutionContext,
		);
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

	test("serves OpenAPI 3.1.0 specification at /api/openapi.json", async () => {
		const res = await app.fetch(
			new Request("http://localhost/api/openapi.json"),
			{} as Env,
			{} as ExecutionContext,
		);
		expect(res.status).toBe(200);
		const spec = (await res.json()) as {
			openapi: string;
			info: { title: string; version: string };
			paths: Record<string, unknown>;
		};
		expect(spec.openapi).toBe("3.1.0");
		expect(spec.info.title).toBe("Muljax ID API");
		expect(spec.info.version).toBe(packageJson.version);
		expect(Object.keys(spec.paths).length).toBeGreaterThan(15);
	});
});
