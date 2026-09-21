import {
	exportPrivateKey,
	exportPublicKey,
	generateKeyPair,
} from "../../src/lib/oauth/keys";
import { createCodeChallenge } from "../../src/lib/oauth/pkce";

let cachedSigningKeys: {
	privateKeyJwk: string;
	publicKeyJwk: JsonWebKey;
	keyPair: CryptoKeyPair;
} | null = null;

/**
 * Returns a cached or generated ECDSA P-256 signing key pair for OIDC tokens.
 */
export async function getTestSigningKeys() {
	if (!cachedSigningKeys) {
		const keyPair = await generateKeyPair();
		const exportedPrivate = await exportPrivateKey(keyPair.privateKey);
		const exportedPublic = await exportPublicKey(keyPair.publicKey);
		cachedSigningKeys = {
			privateKeyJwk: JSON.stringify(exportedPrivate),
			publicKeyJwk: exportedPublic,
			keyPair,
		};
	}
	return cachedSigningKeys;
}

/**
 * Generates a valid PKCE code verifier and SHA-256 code challenge pair.
 */
export async function createTestPkce(
	verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
) {
	const codeChallenge = await createCodeChallenge(verifier);
	return {
		codeVerifier: verifier,
		codeChallenge,
		codeChallengeMethod: "S256" as const,
	};
}
