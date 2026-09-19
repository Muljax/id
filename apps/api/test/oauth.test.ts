import { describe, expect, test } from "bun:test";
import { validateRedirectUri } from "../src/lib/oauth/client";

describe("OAuth Client Redirect URI Validation (RFC 8252)", () => {
	const mockClient = {
		id: "muljax-cli",
		name: "Muljax CLI",
		clientType: "public" as const,
		redirectUris: [
			"http://127.0.0.1/callback",
			"http://localhost/callback",
			"https://app.muljax.com/callback",
		],
		scopes: ["openid", "profile", "email", "ssh:cert:issue"],
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};

	test("matches exact redirect URIs", () => {
		expect(
			validateRedirectUri(mockClient, "https://app.muljax.com/callback"),
		).toBe(true);
		expect(validateRedirectUri(mockClient, "http://127.0.0.1/callback")).toBe(
			true,
		);
		expect(validateRedirectUri(mockClient, "http://localhost/callback")).toBe(
			true,
		);
	});

	test("allows dynamic loopback ports per RFC 8252 Section 7.3", () => {
		expect(
			validateRedirectUri(mockClient, "http://127.0.0.1:49152/callback"),
		).toBe(true);
		expect(
			validateRedirectUri(mockClient, "http://127.0.0.1:52134/callback"),
		).toBe(true);
		expect(
			validateRedirectUri(mockClient, "http://localhost:8080/callback"),
		).toBe(true);
	});

	test("rejects invalid path or hostname for loopback", () => {
		expect(
			validateRedirectUri(mockClient, "http://127.0.0.1:49152/wrong"),
		).toBe(false);
		expect(
			validateRedirectUri(mockClient, "http://attacker.com/callback"),
		).toBe(false);
		expect(
			validateRedirectUri(mockClient, "http://attacker.com:49152/callback"),
		).toBe(false);
		expect(
			validateRedirectUri(mockClient, "https://app.muljax.com:8443/callback"),
		).toBe(false);
	});
});

describe("OAuth Authorization Request Validation & Error Redirection (RFC 6749)", () => {
	const mockDb = {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () => [
						{
							id: "client-1",
							name: "Test App",
							clientType: "public",
							clientSecretHash: null,
							redirectUris: JSON.stringify([
								"https://app.example.com/callback",
							]),
							scopes: JSON.stringify(["openid", "profile", "email"]),
							createdAt: Date.now(),
							updatedAt: Date.now(),
						},
					],
				}),
			}),
		}),
	};

	test("returns non-redirectable error on missing or invalid client/redirect_uri", async () => {
		const { validateAuthorizationRequest } = await import(
			"../src/lib/oauth/authorization"
		);

		// Missing client_id
		const res1 = await validateAuthorizationRequest(mockDb as never, {
			client_id: "",
			redirect_uri: "https://app.example.com/callback",
			response_type: "code",
			scope: "openid",
		});
		expect(res1).toHaveProperty("error");
		if ("error" in res1) {
			expect(res1.redirectable).toBe(false);
		}

		// Missing redirect_uri
		const res2 = await validateAuthorizationRequest(mockDb as never, {
			client_id: "client-1",
			redirect_uri: "",
			response_type: "code",
			scope: "openid",
		});
		expect(res2).toHaveProperty("error");
		if ("error" in res2) {
			expect(res2.redirectable).toBe(false);
		}

		// Invalid redirect_uri
		const res3 = await validateAuthorizationRequest(mockDb as never, {
			client_id: "client-1",
			redirect_uri: "https://evil.com/callback",
			response_type: "code",
			scope: "openid",
		});
		expect(res3).toHaveProperty("error");
		if ("error" in res3) {
			expect(res3.redirectable).toBe(false);
		}
	});

	test("returns redirectable error when client and redirect_uri are valid", async () => {
		const { validateAuthorizationRequest } = await import(
			"../src/lib/oauth/authorization"
		);

		// Unsupported response_type
		const res1 = await validateAuthorizationRequest(mockDb as never, {
			client_id: "client-1",
			redirect_uri: "https://app.example.com/callback",
			response_type: "token",
			scope: "openid",
		});
		expect(res1).toHaveProperty("error", "unsupported_response_type");
		if ("error" in res1) {
			expect(res1.redirectable).toBe(true);
		}

		// Missing PKCE on public client
		const res2 = await validateAuthorizationRequest(mockDb as never, {
			client_id: "client-1",
			redirect_uri: "https://app.example.com/callback",
			response_type: "code",
			scope: "openid",
		});
		expect(res2).toHaveProperty("error", "invalid_request");
		if ("error" in res2) {
			expect(res2.redirectable).toBe(true);
		}

		// Invalid scope
		const res3 = await validateAuthorizationRequest(mockDb as never, {
			client_id: "client-1",
			redirect_uri: "https://app.example.com/callback",
			response_type: "code",
			scope: "invalid_scope_xyz",
			code_challenge: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
			code_challenge_method: "S256",
		});
		expect(res3).toHaveProperty("error", "invalid_scope");
		if ("error" in res3) {
			expect(res3.redirectable).toBe(true);
		}
	});
});

describe("OpenID Discovery Metadata (RFC 8414, RFC 7009, RFC 7662)", () => {
	test("includes revocation and introspection endpoints and auth methods", async () => {
		const openidConfigRoute = (
			await import("../src/routes/well-known/openid-configuration/get")
		).default;
		const { Hono } = await import("hono");

		const app = new Hono<{ Bindings: Env }>();
		app.route("/.well-known/openid-configuration", openidConfigRoute);

		const res = await app.request("/.well-known/openid-configuration", {}, {
			OIDC_ISSUER: "https://id.example.com",
		} as Env);

		expect(res.status).toBe(200);
		const json = (await res.json()) as Record<string, unknown>;

		expect(json.issuer).toBe("https://id.example.com");
		expect(json.authorization_endpoint).toBe(
			"https://id.example.com/oauth/authorize",
		);
		expect(json.token_endpoint).toBe("https://id.example.com/oauth/token");
		expect(json.userinfo_endpoint).toBe(
			"https://id.example.com/oauth/userinfo",
		);
		expect(json.revocation_endpoint).toBe(
			"https://id.example.com/oauth/revoke",
		);
		expect(json.introspection_endpoint).toBe(
			"https://id.example.com/oauth/introspect",
		);
		expect(json.jwks_uri).toBe("https://id.example.com/.well-known/jwks.json");
		expect(json.revocation_endpoint_auth_methods_supported).toEqual([
			"client_secret_basic",
			"client_secret_post",
			"none",
		]);
		expect(json.introspection_endpoint_auth_methods_supported).toEqual([
			"client_secret_basic",
			"client_secret_post",
			"none",
		]);
	});
});

describe("Userinfo Endpoint Scope Enforcement (OIDC Core §5.3.1 / RFC 6750)", () => {
	test("returns 401 with WWW-Authenticate header when token is missing or malformed", async () => {
		const userinfoRoute = (await import("../src/routes/oauth/userinfo/get"))
			.default;
		const { Hono } = await import("hono");

		const app = new Hono<{ Bindings: Env }>();
		app.route("/oauth/userinfo", userinfoRoute);

		// Missing Authorization header
		const res1 = await app.request("/oauth/userinfo", {}, {} as Env);
		expect(res1.status).toBe(401);
		expect(res1.headers.get("WWW-Authenticate")).toBe("Bearer");

		// Malformed Authorization header
		const res2 = await app.request(
			"/oauth/userinfo",
			{
				headers: {
					Authorization: "Basic abc123xyz",
				},
			},
			{} as Env,
		);
		expect(res2.status).toBe(401);
		expect(res2.headers.get("WWW-Authenticate")).toBe(
			'Bearer error="invalid_token"',
		);
	});

	test("returns 403 with insufficient_scope when token does not contain openid scope", async () => {
		const userinfoRoute = (await import("../src/routes/oauth/userinfo/get"))
			.default;
		const { Hono } = await import("hono");

		const mockTokenRow = {
			id: "token-1",
			client_id: "client-1",
			user_id: "user-1",
			token_hash: "hashed",
			scope: "profile email",
			expires_at: Date.now() + 3600000,
			created_at: Date.now(),
			revoked_at: null,
			authorization_code_id: null,
		};

		const mockUserRow = {
			id: "user-1",
			email: "user@example.com",
			display_name: "Test User",
			given_name: null,
			family_name: null,
			middle_name: null,
			nickname: null,
			preferred_username: null,
			profile_url: null,
			profile_image_key: null,
			website: null,
			gender: null,
			birthdate: null,
			zoneinfo: null,
			locale: null,
			email_verified_at: null,
			disabled_at: null,
			updated_at: Date.now(),
		};

		const mockD1 = {
			prepare: (query: string) => {
				const stmt = {
					bind: () => stmt,
					all: async () => {
						if (query.includes("oauth_access_tokens")) {
							return { results: [mockTokenRow], success: true };
						}
						if (query.includes("users")) {
							return { results: [mockUserRow], success: true };
						}
						return { results: [], success: true };
					},
					first: async () => {
						if (query.includes("oauth_access_tokens")) {
							return mockTokenRow;
						}
						if (query.includes("users")) {
							return mockUserRow;
						}
						return null;
					},
					raw: async () => {
						if (query.includes("oauth_access_tokens")) {
							return [Object.values(mockTokenRow)];
						}
						if (query.includes("users")) {
							return [Object.values(mockUserRow)];
						}
						return [];
					},
					run: async () => ({ success: true, meta: {} }),
				};
				return stmt;
			},
			batch: async () => [],
			exec: async () => ({ count: 0, duration: 0 }),
			dump: async () => new ArrayBuffer(0),
		} as unknown as D1Database;

		const app = new Hono<{ Bindings: Env }>();
		app.route("/oauth/userinfo", userinfoRoute);

		const res = await app.request(
			"/oauth/userinfo",
			{
				headers: {
					Authorization: "Bearer test-access-token",
				},
			},
			{
				DB: mockD1,
			} as Env,
		);

		expect(res.status).toBe(403);
		expect(res.headers.get("WWW-Authenticate")).toContain("insufficient_scope");
		const json = (await res.json()) as Record<string, unknown>;
		expect(json.error).toBe("insufficient_scope");
	});
});
