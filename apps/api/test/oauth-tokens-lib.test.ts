import { describe, expect, test } from "bun:test";
import {
	createAccessToken,
	createRefreshToken,
	getAccessToken,
	getRefreshToken,
	revokeAccessToken,
	revokeRefreshToken,
} from "../src/lib/oauth/tokens";
import {
	grantOAuthAccess,
	hasOAuthGrant,
	revokeOAuthAccess,
} from "../src/lib/oauth/grant";
import { createTestDb, createTestOAuthClient, createTestUser } from "./helpers";

describe("OAuth Tokens & Grants Library Utilities", () => {
	test("createAccessToken, getAccessToken, and revokeAccessToken lifecycle", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "user1@example.com",
		});
		const { client } = await createTestOAuthClient(db, {
			scopes: ["openid", "profile", "email"],
		});
		const scope = "openid profile email";

		const { token, expiresAt } = await createAccessToken(
			db,
			client.id,
			userId,
			scope,
		);
		expect(typeof token).toBe("string");
		expect(expiresAt).toBeGreaterThan(Date.now());

		// Retrieve active token
		const record = await getAccessToken(db, token);
		expect(record).not.toBeNull();
		expect(record?.clientId).toBe(client.id);
		expect(record?.userId).toBe(userId);
		expect(record?.scope).toBe(scope);

		// Revoke token
		await revokeAccessToken(db, token);

		// Revoked token should return null on getAccessToken
		const revokedRecord = await getAccessToken(db, token);
		expect(revokedRecord).toBeNull();
	});

	test("createRefreshToken, getRefreshToken, and revokeRefreshToken lifecycle", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "user2@example.com",
		});
		const { client } = await createTestOAuthClient(db, { scopes: ["openid"] });
		const scope = "openid";

		const { token, expiresAt } = await createRefreshToken(
			db,
			client.id,
			userId,
			scope,
		);
		expect(typeof token).toBe("string");
		expect(expiresAt).toBeGreaterThan(Date.now());

		// Retrieve active refresh token
		const record = await getRefreshToken(db, token);
		expect(record).not.toBeNull();
		expect(record?.clientId).toBe(client.id);
		expect(record?.userId).toBe(userId);

		// Revoke token
		await revokeRefreshToken(db, token);

		const revokedRecord = await getRefreshToken(db, token);
		expect(revokedRecord).toBeNull();
	});

	test("grantOAuthAccess creates new grant and merges scopes when updated", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "grantuser@example.com",
		});
		const { client } = await createTestOAuthClient(db, {
			scopes: ["openid", "profile", "email", "users:read"],
		});

		// 1. Initial grant
		await grantOAuthAccess(db, {
			userId,
			clientId: client.id,
			scopes: ["openid", "profile"],
		});

		expect(await hasOAuthGrant(db, userId, client.id, ["openid"])).toBe(true);
		expect(
			await hasOAuthGrant(db, userId, client.id, ["openid", "profile"]),
		).toBe(true);
		expect(await hasOAuthGrant(db, userId, client.id, ["email"])).toBe(false);

		// 2. Add extra scopes to existing grant
		await grantOAuthAccess(db, {
			userId,
			clientId: client.id,
			scopes: ["email", "users:read"],
		});

		expect(
			await hasOAuthGrant(db, userId, client.id, [
				"openid",
				"profile",
				"email",
				"users:read",
			]),
		).toBe(true);
	});

	test("revokeOAuthAccess revokes user grant and cascades revocation to active access & refresh tokens", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "cascade@example.com",
		});
		const { client } = await createTestOAuthClient(db, {
			scopes: ["openid", "profile"],
		});

		await grantOAuthAccess(db, {
			userId,
			clientId: client.id,
			scopes: ["openid", "profile"],
		});

		const accessTok = await createAccessToken(db, client.id, userId, "openid");
		const refreshTok = await createRefreshToken(
			db,
			client.id,
			userId,
			"openid",
		);

		expect(await getAccessToken(db, accessTok.token)).not.toBeNull();
		expect(await getRefreshToken(db, refreshTok.token)).not.toBeNull();
		expect(await hasOAuthGrant(db, userId, client.id, ["openid"])).toBe(true);

		// Revoke the whole grant
		await revokeOAuthAccess(db, userId, client.id);

		expect(await hasOAuthGrant(db, userId, client.id, ["openid"])).toBe(false);
		expect(await getAccessToken(db, accessTok.token)).toBeNull();
		expect(await getRefreshToken(db, refreshTok.token)).toBeNull();
	});
});
