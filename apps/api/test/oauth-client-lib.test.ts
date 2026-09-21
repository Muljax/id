import { describe, expect, test } from "bun:test";
import {
	clientSupportsScope,
	clientSupportsScopes,
	createOAuthClient,
	deleteOAuthClient,
	getOAuthClient,
	getOAuthClients,
	isOAuthClientType,
	isValidScopeString,
	updateOAuthClient,
	validateClient,
	validateRedirectUri,
	verifyClientSecret,
} from "../src/lib/oauth/client";
import { hashToken } from "../src/lib/token";
import { createTestDb } from "./helpers";

describe("OAuth Client Management & Validation Utilities", () => {
	test("isOAuthClientType validates public and confidential client types", () => {
		expect(isOAuthClientType("public")).toBe(true);
		expect(isOAuthClientType("confidential")).toBe(true);
		expect(isOAuthClientType("unknown")).toBe(false);
		expect(isOAuthClientType("")).toBe(false);
	});

	test("isValidScopeString validates scope characters and length bounds", () => {
		expect(isValidScopeString("openid")).toBe(true);
		expect(isValidScopeString("users:read")).toBe(true);
		expect(isValidScopeString("ssh:principal:root")).toBe(true);
		expect(isValidScopeString("*")).toBe(true);
		expect(isValidScopeString("app-scoped_v1.0")).toBe(true);

		expect(isValidScopeString("")).toBe(false);
		expect(isValidScopeString("scope with space")).toBe(false);
		expect(isValidScopeString("scope$special#chars")).toBe(false);
		expect(isValidScopeString("a".repeat(65))).toBe(false);
	});

	test("createOAuthClient, getOAuthClient, getOAuthClients CRUD operations", async () => {
		const { db } = createTestDb();
		const secret = "my-confidential-secret-12345";
		const secretHash = await hashToken(secret);

		const client = await createOAuthClient(db, {
			name: "Test App",
			clientType: "confidential",
			clientSecretHash: secretHash,
			redirectUris: ["https://app.example.com/callback"],
			scopes: ["openid", "profile", "email"],
		});

		expect(client).not.toBeNull();
		expect(client?.name).toBe("Test App");
		expect(client?.clientType).toBe("confidential");
		expect(client?.redirectUris).toEqual(["https://app.example.com/callback"]);
		expect(client?.scopes).toEqual(["openid", "profile", "email"]);

		const fetched = await getOAuthClient(db, client!.id);
		expect(fetched?.id).toBe(client?.id);

		const allClients = await getOAuthClients(db);
		expect(allClients).toHaveLength(1);
		expect(allClients[0].id).toBe(client?.id);
	});

	test("updateOAuthClient updates name, redirect URIs, and scopes", async () => {
		const { db } = createTestDb();
		const client = await createOAuthClient(db, {
			name: "Initial Name",
			clientType: "public",
			redirectUris: ["https://initial.com/cb"],
			scopes: ["openid"],
		});

		const updated = await updateOAuthClient(db, client!.id, {
			name: "Updated Name",
			redirectUris: ["https://updated.com/cb", "http://localhost:8080/cb"],
			scopes: ["openid", "profile", "users:read"],
		});

		expect(updated?.name).toBe("Updated Name");
		expect(updated?.redirectUris).toEqual([
			"https://updated.com/cb",
			"http://localhost:8080/cb",
		]);
		expect(updated?.scopes).toEqual(["openid", "profile", "users:read"]);
	});

	test("deleteOAuthClient deletes client record and handles non-existent client", async () => {
		const { db } = createTestDb();
		const client = await createOAuthClient(db, {
			name: "To Delete",
			clientType: "public",
			redirectUris: [],
			scopes: ["openid"],
		});

		const deleted = await deleteOAuthClient(db, client!.id);
		expect(deleted?.id).toBe(client?.id);

		expect(await getOAuthClient(db, client!.id)).toBeNull();
		expect(await deleteOAuthClient(db, "non-existent-id")).toBeNull();
	});

	test("validateClient and client scope helpers", async () => {
		const { db } = createTestDb();
		const client = await createOAuthClient(db, {
			name: "Scoped App",
			clientType: "public",
			redirectUris: ["https://example.com/cb"],
			scopes: ["openid", "profile", "settings:read"],
		});

		expect(validateClient(client)).toBe(true);
		expect(validateClient(null)).toBe(false);

		expect(clientSupportsScope(client, "openid")).toBe(true);
		expect(clientSupportsScope(client, "admin")).toBe(false);
		expect(clientSupportsScope(null, "openid")).toBe(false);

		expect(clientSupportsScopes(client, ["openid", "profile"])).toBe(true);
		expect(clientSupportsScopes(client, ["openid", "admin"])).toBe(false);
		expect(clientSupportsScopes(null, ["openid"])).toBe(false);
	});

	test("verifyClientSecret verifies secret for confidential clients and rejects public clients", async () => {
		const { db } = createTestDb();
		const secret = "valid-client-secret-999";
		const secretHash = await hashToken(secret);

		const confClient = await createOAuthClient(db, {
			name: "Confidential Client",
			clientType: "confidential",
			clientSecretHash: secretHash,
			redirectUris: [],
			scopes: ["openid"],
		});

		const pubClient = await createOAuthClient(db, {
			name: "Public Client",
			clientType: "public",
			redirectUris: [],
			scopes: ["openid"],
		});

		expect(await verifyClientSecret(confClient, secret)).toBe(true);
		expect(await verifyClientSecret(confClient, "wrong-secret")).toBe(false);
		expect(await verifyClientSecret(pubClient, secret)).toBe(false);
		expect(await verifyClientSecret(null, secret)).toBe(false);
	});

	test("validateRedirectUri enforces exact match and RFC 8252 loopback port exceptions", async () => {
		const { db } = createTestDb();
		const client = await createOAuthClient(db, {
			name: "Redirect Client",
			clientType: "public",
			redirectUris: [
				"https://app.example.com/oauth/callback",
				"http://127.0.0.1/callback",
				"http://localhost:3000/auth",
				"http://[::1]/callback",
			],
			scopes: ["openid"],
		});

		// Exact match
		expect(
			validateRedirectUri(client, "https://app.example.com/oauth/callback"),
		).toBe(true);
		expect(
			validateRedirectUri(client, "https://app.example.com/oauth/other"),
		).toBe(false);

		// RFC 8252 loopback dynamic port tests for 127.0.0.1
		expect(validateRedirectUri(client, "http://127.0.0.1:49152/callback")).toBe(
			true,
		);
		expect(validateRedirectUri(client, "http://127.0.0.1:8080/callback")).toBe(
			true,
		);
		expect(validateRedirectUri(client, "http://127.0.0.1:8080/wrongpath")).toBe(
			false,
		);
		expect(validateRedirectUri(client, "https://127.0.0.1:8080/callback")).toBe(
			false,
		);

		// RFC 8252 loopback for localhost
		expect(validateRedirectUri(client, "http://localhost:55555/auth")).toBe(
			true,
		);
		expect(
			validateRedirectUri(client, "http://localhost:55555/different"),
		).toBe(false);

		// RFC 8252 loopback for IPv6 [::1]
		expect(validateRedirectUri(client, "http://[::1]:9999/callback")).toBe(
			true,
		);

		// Malformed URIs
		expect(validateRedirectUri(client, "invalid-url")).toBe(false);
		expect(
			validateRedirectUri(null, "https://app.example.com/oauth/callback"),
		).toBe(false);
	});
});
