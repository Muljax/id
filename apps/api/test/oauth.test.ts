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
