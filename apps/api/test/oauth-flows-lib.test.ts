import { describe, expect, test } from "bun:test";
import * as schema from "../src/db/schema";
import {
	createAuthorizationCode,
	validateAuthorizationRequest,
} from "../src/lib/oauth/authorization";
import { exchangeAuthorizationCode } from "../src/lib/oauth/authorization-code";
import {
	authenticateClient,
	getBasicClientCredentials,
} from "../src/lib/oauth/client-auth";
import { exchangeClientCredentials } from "../src/lib/oauth/client-credentials";
import {
	approveDeviceCode,
	createDeviceAuthorization,
	denyDeviceCode,
	exchangeDeviceCode,
	generateDeviceCode,
	generateUserCode,
	getDeviceCodeDetails,
	normalizeUserCode,
} from "../src/lib/oauth/device";
import { createCodeChallenge } from "../src/lib/oauth/pkce";
import { exchangeRefreshToken } from "../src/lib/oauth/refresh-token";
import { createRefreshToken } from "../src/lib/oauth/tokens";
import { hashToken } from "../src/lib/token";
import {
	createTestContext,
	createTestDb,
	createTestOAuthClient,
	createTestUser,
	getTestSigningKeys,
} from "./helpers";

describe("OAuth Flows & Authorization Libraries", () => {
	test("getBasicClientCredentials parses valid headers and rejects invalid formats", () => {
		expect(getBasicClientCredentials(undefined)).toBeNull();
		expect(getBasicClientCredentials("Bearer xyz")).toBeNull();
		expect(getBasicClientCredentials("Basic")).toBeNull();
		expect(getBasicClientCredentials("Basic !!!invalidbase64")).toBeNull();

		// Basic btoa("my-client-id:my-secret")
		const header = `Basic ${btoa("my-client-id:my-secret")}`;
		const parsed = getBasicClientCredentials(header);
		expect(parsed).toEqual({
			clientId: "my-client-id",
			clientSecret: "my-secret",
		});
	});

	test("validateAuthorizationRequest validates all RFC 6749 & PKCE requirements", async () => {
		const { db } = createTestDb();

		await createTestOAuthClient(db, {
			id: "client-pub",
			name: "Public Native Client",
			clientType: "public",
			redirectUris: ["https://app.example.com/callback"],
			scopes: ["openid", "profile", "email"],
		});

		// 1. Missing client_id
		const r1 = await validateAuthorizationRequest(db, {
			client_id: "",
			redirect_uri: "https://app.example.com/callback",
			response_type: "code",
			scope: "openid",
		});
		expect("error" in r1 && r1.error).toBe("invalid_request");

		// 2. Unknown client
		const r2 = await validateAuthorizationRequest(db, {
			client_id: "unknown",
			redirect_uri: "https://app.example.com/callback",
			response_type: "code",
			scope: "openid",
		});
		expect("error" in r2 && r2.error).toBe("invalid_request");

		// 3. Invalid redirect URI
		const r3 = await validateAuthorizationRequest(db, {
			client_id: "client-pub",
			redirect_uri: "https://evil.com/callback",
			response_type: "code",
			scope: "openid",
		});
		expect("error" in r3 && r3.error).toBe("invalid_request");

		// 4. Unsupported response_type != code
		const r4 = await validateAuthorizationRequest(db, {
			client_id: "client-pub",
			redirect_uri: "https://app.example.com/callback",
			response_type: "token",
			scope: "openid",
		});
		expect("error" in r4 && r4.error).toBe("unsupported_response_type");

		// 5. PKCE required for public client
		const r5 = await validateAuthorizationRequest(db, {
			client_id: "client-pub",
			redirect_uri: "https://app.example.com/callback",
			response_type: "code",
			scope: "openid",
		});
		expect("error" in r5 && r5.error).toBe("invalid_request");
		expect("error_description" in r5 && r5.error_description).toContain(
			"code_challenge is required",
		);

		// 6. Missing openid scope
		const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
		const codeChallenge = await createCodeChallenge(codeVerifier);
		const r6 = await validateAuthorizationRequest(db, {
			client_id: "client-pub",
			redirect_uri: "https://app.example.com/callback",
			response_type: "code",
			scope: "profile",
			code_challenge: codeChallenge,
			code_challenge_method: "S256",
		});
		expect("error" in r6 && r6.error).toBe("invalid_scope");

		// 7. Successful authorization request
		const r7 = await validateAuthorizationRequest(db, {
			client_id: "client-pub",
			redirect_uri: "https://app.example.com/callback",
			response_type: "code",
			scope: "openid profile",
			code_challenge: codeChallenge,
			code_challenge_method: "S256",
		});
		expect("client" in r7).toBe(true);
	});

	test("createAuthorizationCode and exchangeAuthorizationCode with PKCE & Token Issuance", async () => {
		const { db, d1 } = createTestDb();
		const { privateKeyJwk } = await getTestSigningKeys();
		const now = Date.now();
		const { id: userId } = await createTestUser(db, {
			email: "user@example.com",
		});

		const { client } = await createTestOAuthClient(db, {
			name: "PKCE App",
			clientType: "public",
			redirectUris: ["https://app.example.com/callback"],
			scopes: ["openid", "profile"],
		});

		const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
		const codeChallenge = await createCodeChallenge(codeVerifier);

		const code = await createAuthorizationCode(
			db,
			{
				client_id: client.id,
				redirect_uri: "https://app.example.com/callback",
				response_type: "code",
				scope: "openid profile",
				code_challenge: codeChallenge,
				code_challenge_method: "S256",
			},
			client.id,
			["openid", "profile"],
			userId,
			Math.floor(now / 1000),
		);

		const ctx = createTestContext({
			env: {
				DB: d1,
				OIDC_PRIVATE_KEY: privateKeyJwk,
			},
		});

		// Exchange code for tokens
		const res = await exchangeAuthorizationCode(ctx, {
			grant_type: "authorization_code",
			client_id: client.id,
			code,
			redirect_uri: "https://app.example.com/callback",
			code_verifier: codeVerifier,
		});

		expect(res.status).toBe(200);
		const tokenData = (await res.json()) as {
			access_token: string;
			refresh_token: string;
			id_token: string;
			token_type: string;
		};

		expect(tokenData.token_type).toBe("Bearer");
		expect(tokenData.access_token).toBeDefined();
		expect(tokenData.refresh_token).toBeDefined();
		expect(tokenData.id_token).toBeDefined();

		// Single-use code test: Attempting to reuse code must fail
		const reuseRes = await exchangeAuthorizationCode(ctx, {
			grant_type: "authorization_code",
			client_id: client.id,
			code,
			redirect_uri: "https://app.example.com/callback",
			code_verifier: codeVerifier,
		});
		expect(reuseRes.status).toBe(400);
	});

	test("exchangeRefreshToken with Token Rotation and Reuse Detection", async () => {
		const { db, d1 } = createTestDb();
		const { id: userId } = await createTestUser(db, {
			email: "refresh@example.com",
		});
		const { client } = await createTestOAuthClient(db, {
			name: "Refresh Client",
			clientType: "public",
			scopes: ["openid"],
		});

		const { token: initialRefreshToken } = await createRefreshToken(
			db,
			client.id,
			userId,
			"openid",
		);

		const ctx = createTestContext({ env: { DB: d1 } });

		// 1. First refresh exchange succeeds and returns rotated new tokens
		const res1 = await exchangeRefreshToken(ctx, {
			grant_type: "refresh_token",
			client_id: client.id,
			refresh_token: initialRefreshToken,
		});

		expect(res1.status).toBe(200);
		const data1 = (await res1.json()) as {
			access_token: string;
			refresh_token: string;
		};
		expect(data1.refresh_token).not.toBe(initialRefreshToken);

		// 2. Refresh token reuse detection (RFC 6819): Replaying initialRefreshToken must revoke active grant
		const reuseRes = await exchangeRefreshToken(ctx, {
			grant_type: "refresh_token",
			client_id: client.id,
			refresh_token: initialRefreshToken,
		});
		expect(reuseRes.status).toBe(400);
	});

	test("exchangeClientCredentials issues M2M JWT tokens for confidential clients", async () => {
		const { db, d1 } = createTestDb();
		const { privateKeyJwk } = await getTestSigningKeys();
		const secret = "confidential-secret-999";
		const secretHash = await hashToken(secret);

		const [client] = await db
			.insert(schema.oauthClients)
			.values({
				id: "conf-client-m2m",
				name: "M2M Daemon",
				clientType: "confidential",
				clientSecretHash: secretHash,
				redirectUris: JSON.stringify([]),
				scopes: JSON.stringify(["users:read", "settings:read"]),
				createdAt: Date.now(),
				updatedAt: Date.now(),
			})
			.returning();

		const ctx = createTestContext({
			env: {
				DB: d1,
				OIDC_PRIVATE_KEY: privateKeyJwk,
			},
			headers: {
				Authorization: `Basic ${btoa("conf-client-m2m:confidential-secret-999")}`,
			},
		});

		const res = await exchangeClientCredentials(ctx, {
			grant_type: "client_credentials",
			scope: "users:read",
			audience: "https://api.example.com",
		});

		expect(res.status).toBe(200);
		const data = (await res.json()) as {
			access_token: string;
			token_type: string;
			scope: string;
		};
		expect(data.token_type).toBe("Bearer");
		expect(data.scope).toBe("users:read");
		expect(data.access_token.split(".")).toHaveLength(3);
	});

	test("OAuth 2.0 Device Authorization flow: create, details, approve, poll exchange", async () => {
		const { db, d1 } = createTestDb();
		const { privateKeyJwk } = await getTestSigningKeys();
		const { id: userId } = await createTestUser(db, {
			email: "deviceuser@example.com",
		});
		const { client } = await createTestOAuthClient(db, {
			name: "CLI Device Client",
			clientType: "public",
			scopes: ["openid", "profile"],
		});

		// User code helpers
		const rawUserCode = generateUserCode();
		expect(rawUserCode.length).toBe(9); // "XXXX-XXXX"
		expect(normalizeUserCode("xxxx-xxxx")).toBe("XXXX-XXXX");
		expect(normalizeUserCode("xxxxxxxx")).toBe("XXXX-XXXX");

		const ctx = createTestContext({
			env: {
				DB: d1,
				OIDC_PRIVATE_KEY: privateKeyJwk,
			},
		});

		// 1. Create Device Authorization
		const createRes = await createDeviceAuthorization(ctx, {
			client_id: client.id,
			scope: "openid profile",
		});
		expect(createRes.status).toBe(200);
		const authData = (await createRes.json()) as {
			device_code: string;
			user_code: string;
			verification_uri: string;
			interval: number;
		};

		// 2. Check Device Code Details
		const details = await getDeviceCodeDetails(db, authData.user_code);
		expect(details).not.toBeNull();
		expect(details?.clientId).toBe(client.id);
		expect(details?.status).toBe("pending");

		// 3. Poll before approval returns authorization_pending
		const pollPendingRes = await exchangeDeviceCode(ctx, {
			client_id: client.id,
			device_code: authData.device_code,
		});
		expect(pollPendingRes.status).toBe(400);
		expect(((await pollPendingRes.json()) as { error: string }).error).toBe(
			"authorization_pending",
		);

		// 4. Approve device code by user
		const approved = await approveDeviceCode(db, authData.user_code, userId);
		expect(approved).toBe(true);

		// 5. Poll after approval succeeds and issues tokens
		// Mock lastPolledAt so slow_down isn't triggered
		await db
			.update(schema.oauthDeviceCodes)
			.set({ lastPolledAt: Date.now() - 10000 });

		const pollApprovedRes = await exchangeDeviceCode(ctx, {
			client_id: client.id,
			device_code: authData.device_code,
		});

		expect(pollApprovedRes.status).toBe(200);
		const finalTokens = (await pollApprovedRes.json()) as {
			access_token: string;
			refresh_token: string;
		};
		expect(finalTokens.access_token).toBeDefined();
		expect(finalTokens.refresh_token).toBeDefined();
	});
});
