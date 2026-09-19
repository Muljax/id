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
