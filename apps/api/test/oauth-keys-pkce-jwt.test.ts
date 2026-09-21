import { describe, expect, test } from "bun:test";
import {
	exportPrivateKey,
	exportPublicKey,
	generateKeyPair,
	getKeyId,
	getPublicJwk,
	importPrivateKey,
	importPublicKey,
	sign,
} from "../src/lib/oauth/keys";
import {
	createCodeChallenge,
	verifyCodeChallenge,
} from "../src/lib/oauth/pkce";
import { createIdToken } from "../src/lib/oauth/id-token";
import { createJwtAccessToken } from "../src/lib/oauth/jwt-access-token";

describe("OAuth Crypto Keys, PKCE, & JWTs", () => {
	test("ECDSA P-256 Key Operations: generate, export, import, sign, getPublicJwk", async () => {
		const keyPair = await generateKeyPair();
		expect(keyPair.privateKey).toBeDefined();
		expect(keyPair.publicKey).toBeDefined();

		const exportedPrivate = await exportPrivateKey(keyPair.privateKey);
		const exportedPublic = await exportPublicKey(keyPair.publicKey);

		expect(exportedPublic.kid).toBe(getKeyId());
		expect(exportedPublic.alg).toBe("ES256");
		expect(exportedPublic.use).toBe("sig");

		const privateJwkString = JSON.stringify(exportedPrivate);
		const publicDerived = getPublicJwk(privateJwkString);
		expect(publicDerived.kty).toBe(exportedPrivate.kty);
		expect(publicDerived.crv).toBe(exportedPrivate.crv);
		expect(publicDerived.x).toBe(exportedPrivate.x);
		expect(publicDerived.y).toBe(exportedPrivate.y);

		const reimportedPrivate = await importPrivateKey(privateJwkString);
		const reimportedPublic = await importPublicKey(publicDerived);

		const dataToSign = new TextEncoder().encode("oauth-token-signing-payload");
		const signature = await sign(reimportedPrivate, dataToSign);
		expect(signature.byteLength).toBe(64); // ECDSA P-256 IEEE P1363 signature is 64 bytes

		const isValid = await crypto.subtle.verify(
			{ name: "ECDSA", hash: "SHA-256" },
			reimportedPublic,
			signature,
			dataToSign,
		);
		expect(isValid).toBe(true);
	});

	test("PKCE S256 Challenge creation and verification", async () => {
		const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
		const challenge = await createCodeChallenge(verifier);

		expect(typeof challenge).toBe("string");
		expect(challenge.length).toBe(43); // 32-byte SHA256 base64url encoded is 43 characters
		expect(challenge).not.toContain("=");
		expect(challenge).not.toContain("+");
		expect(challenge).not.toContain("/");

		expect(await verifyCodeChallenge(verifier, challenge)).toBe(true);
		expect(
			await verifyCodeChallenge(
				"wrong_verifier_string_12345678901234567890",
				challenge,
			),
		).toBe(false);
	});

	test("createIdToken produces valid signed OIDC ID Token with expected claims", async () => {
		const keyPair = await generateKeyPair();
		const exportedPrivate = await exportPrivateKey(keyPair.privateKey);
		const privateKeyJwk = JSON.stringify(exportedPrivate);

		const idToken = await createIdToken({
			privateKey: privateKeyJwk,
			issuer: "https://id.example.com",
			clientId: "client-abc",
			userId: "user-123",
			nonce: "test-nonce-value",
			authTime: 1700000000,
			acr: "urn:muljax:id:mfa",
			expiresIn: 3600,
		});

		const [headerB64, payloadB64, signatureB64] = idToken.split(".");
		expect(headerB64).toBeDefined();
		expect(payloadB64).toBeDefined();
		expect(signatureB64).toBeDefined();

		const header = JSON.parse(
			new TextDecoder().decode(
				Uint8Array.fromBase64(headerB64, { alphabet: "base64url" }),
			),
		);
		const payload = JSON.parse(
			new TextDecoder().decode(
				Uint8Array.fromBase64(payloadB64, { alphabet: "base64url" }),
			),
		);

		expect(header.alg).toBe("ES256");
		expect(header.typ).toBe("JWT");
		expect(header.kid).toBe(getKeyId());

		expect(payload.iss).toBe("https://id.example.com");
		expect(payload.sub).toBe("user-123");
		expect(payload.aud).toBe("client-abc");
		expect(payload.nonce).toBe("test-nonce-value");
		expect(payload.auth_time).toBe(1700000000);
		expect(payload.acr).toBe("urn:muljax:id:mfa");
		expect(payload.exp).toBeGreaterThan(payload.iat);
	});

	test("createJwtAccessToken produces RFC 9068 conformant at+jwt access token", async () => {
		const keyPair = await generateKeyPair();
		const exportedPrivate = await exportPrivateKey(keyPair.privateKey);
		const privateKeyJwk = JSON.stringify(exportedPrivate);

		const jwtAccessToken = await createJwtAccessToken({
			privateKey: privateKeyJwk,
			issuer: "https://id.example.com",
			clientId: "confidential-client-1",
			sub: "confidential-client-1",
			audience: "https://api.example.com",
			scope: "users:read settings:read",
			expiresIn: 3600,
		});

		const [headerB64, payloadB64] = jwtAccessToken.split(".");
		const header = JSON.parse(
			new TextDecoder().decode(
				Uint8Array.fromBase64(headerB64, { alphabet: "base64url" }),
			),
		);
		const payload = JSON.parse(
			new TextDecoder().decode(
				Uint8Array.fromBase64(payloadB64, { alphabet: "base64url" }),
			),
		);

		expect(header.alg).toBe("ES256");
		expect(header.typ).toBe("at+jwt");
		expect(header.kid).toBe(getKeyId());

		expect(payload.iss).toBe("https://id.example.com");
		expect(payload.sub).toBe("confidential-client-1");
		expect(payload.client_id).toBe("confidential-client-1");
		expect(payload.aud).toBe("https://api.example.com");
		expect(payload.scope).toBe("users:read settings:read");
		expect(payload.jti).toBeDefined();
	});
});
