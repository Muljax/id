import { describe, expect, test } from "bun:test";
import {
	createCodeChallenge,
	createIdToken,
	createJwtAccessToken,
	exportPrivateKey,
	exportPublicKey,
	generateKeyPair,
	getKeyId,
	getPublicJwk,
	importPrivateKey,
	importPublicKey,
	sign,
	verifyCodeChallenge,
} from "../src/jwt";

describe("@id/crypto: JWT, PKCE, and ECDSA P-256", () => {
	test("ECDSA P-256 key operations", async () => {
		const keyPair = await generateKeyPair();
		expect(keyPair.privateKey).toBeDefined();
		expect(keyPair.publicKey).toBeDefined();

		const exportedPrivate = await exportPrivateKey(keyPair.privateKey);
		const exportedPublic = await exportPublicKey(keyPair.publicKey);

		expect(exportedPublic.kid).toBe(getKeyId());
		expect(exportedPublic.alg).toBe("ES256");

		const privateJwkString = JSON.stringify(exportedPrivate);
		const publicDerived = getPublicJwk(privateJwkString);
		expect(publicDerived.kty).toBe("EC");

		const reimportedPrivate = await importPrivateKey(privateJwkString);
		const reimportedPublic = await importPublicKey(publicDerived);

		const data = new TextEncoder().encode("test-signing-payload");
		const signature = await sign(reimportedPrivate, data);
		expect(signature.byteLength).toBe(64);

		const isValid = await crypto.subtle.verify(
			{ name: "ECDSA", hash: "SHA-256" },
			reimportedPublic,
			signature,
			data,
		);
		expect(isValid).toBe(true);
	});

	test("PKCE S256 challenge generation and verification", async () => {
		const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
		const challenge = await createCodeChallenge(verifier);

		expect(typeof challenge).toBe("string");
		expect(challenge.length).toBe(43);
		expect(await verifyCodeChallenge(verifier, challenge)).toBe(true);
		expect(await verifyCodeChallenge("wrong-verifier", challenge)).toBe(false);
	});

	test("createIdToken produces valid ES256 OIDC JWT", async () => {
		const keyPair = await generateKeyPair();
		const exportedPrivate = await exportPrivateKey(keyPair.privateKey);
		const privateKeyJwk = JSON.stringify(exportedPrivate);

		const idToken = await createIdToken({
			privateKey: privateKeyJwk,
			issuer: "https://id.example.com",
			clientId: "client-123",
			userId: "user-456",
			nonce: "nonce-abc",
			expiresIn: 3600,
		});

		const [headerB64, payloadB64, signatureB64] = idToken.split(".");
		expect(headerB64).toBeDefined();
		expect(payloadB64).toBeDefined();
		expect(signatureB64).toBeDefined();
	});

	test("createJwtAccessToken produces valid at+jwt access token", async () => {
		const keyPair = await generateKeyPair();
		const exportedPrivate = await exportPrivateKey(keyPair.privateKey);
		const privateKeyJwk = JSON.stringify(exportedPrivate);

		const token = await createJwtAccessToken({
			privateKey: privateKeyJwk,
			issuer: "https://id.example.com",
			clientId: "client-123",
			sub: "user-456",
			scope: "openid profile",
			expiresIn: 3600,
		});

		const [headerB64] = token.split(".");
		const header = JSON.parse(
			new TextDecoder().decode(
				Uint8Array.fromBase64(headerB64, { alphabet: "base64url" }),
			),
		);
		expect(header.typ).toBe("at+jwt");
	});
});
