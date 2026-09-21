import type { Context } from "hono";

export interface CreateTestContextOptions {
	env?: Partial<Env>;
	headers?: Record<string, string>;
	url?: string;
	method?: string;
}

/**
 * Creates a fully typed mock Cloudflare Worker environment.
 */
export function createTestEnv(overrides: Partial<Env> = {}): Env {
	return {
		DB: {} as D1Database,
		OIDC_PRIVATE_KEY: "",
		OIDC_ISSUER: "https://id.example.com",
		DASHBOARD_DOMAIN: "id.example.com",
		LOCALHOST: "false",
		...overrides,
	};
}

/**
 * Creates a mock Hono Request Context for testing middleware and route handlers.
 */
export function createTestContext(
	options: CreateTestContextOptions = {},
): Context<{ Bindings: Env }> {
	const env = createTestEnv(options.env);
	const reqHeaders = new Headers(options.headers || {});
	const resHeaders = new Headers();
	const variables = new Map<string, unknown>();
	const url = options.url || "https://id.example.com/test";
	const method = options.method || "GET";

	const c = {
		env,
		req: {
			url,
			method,
			raw: {
				headers: reqHeaders,
				url,
				method,
			},
			header: (name?: string) => {
				if (!name) {
					const all: Record<string, string> = {};
					reqHeaders.forEach((v, k) => {
						all[k.toLowerCase()] = v;
					});
					return all;
				}
				return reqHeaders.get(name) ?? undefined;
			},
			query: (key?: string) => {
				const u = new URL(url);
				if (!key) {
					return Object.fromEntries(u.searchParams.entries());
				}
				return u.searchParams.get(key) ?? undefined;
			},
		},
		header: (name: string, value: string) => {
			resHeaders.append(name, value);
		},
		set: (key: string, value: unknown) => {
			variables.set(key, value);
		},
		get: (key: string) => {
			return variables.get(key);
		},
		res: {
			headers: resHeaders,
		},
		json: (data: unknown, status = 200, headers?: Record<string, string>) => {
			const finalHeaders = new Headers(resHeaders);
			finalHeaders.set("Content-Type", "application/json");
			if (headers) {
				for (const [k, v] of Object.entries(headers)) {
					finalHeaders.set(k, v);
				}
			}
			return new Response(JSON.stringify(data), {
				status,
				headers: finalHeaders,
			});
		},
		text: (text: string, status = 200, headers?: Record<string, string>) => {
			const finalHeaders = new Headers(resHeaders);
			finalHeaders.set("Content-Type", "text/plain");
			if (headers) {
				for (const [k, v] of Object.entries(headers)) {
					finalHeaders.set(k, v);
				}
			}
			return new Response(text, {
				status,
				headers: finalHeaders,
			});
		},
	} as unknown as Context<{ Bindings: Env }>;

	return c;
}
