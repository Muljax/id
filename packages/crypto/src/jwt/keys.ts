const ALGORITHM = {
	name: "ECDSA",
	namedCurve: "P-256",
} as const;

const SIGN_ALGORITHM = {
	name: "ECDSA",
	hash: "SHA-256",
} as const;

const KEY_ID = "Muljax-id-1";

/**
 * Imports an ECDSA private key from a serialized JWK.
 *
 * @param privateKey The serialized private JWK.
 * @returns The imported private signing key.
 */
export async function importPrivateKey(privateKey: string) {
	return crypto.subtle.importKey(
		"jwk",
		JSON.parse(privateKey),
		ALGORITHM,
		false,
		["sign"],
	);
}

/**
 * Imports an ECDSA public key from a JWK.
 *
 * @param publicKey The public JWK to import.
 * @returns The imported public verification key.
 */
export async function importPublicKey(publicKey: JsonWebKey) {
	return crypto.subtle.importKey("jwk", publicKey, ALGORITHM, true, ["verify"]);
}

/**
 * Generates an extractable ECDSA P-256 key pair.
 *
 * @returns The generated private and public keys.
 */
export async function generateKeyPair() {
	return crypto.subtle.generateKey(ALGORITHM, true, ["sign", "verify"]);
}

/**
 * Exports an ECDSA private key as a JWK.
 *
 * @param key The private key to export.
 * @returns The private key as a JWK.
 */
export async function exportPrivateKey(key: CryptoKey) {
	return crypto.subtle.exportKey("jwk", key);
}

/**
 * Exports an ECDSA public key as a JWK with its OIDC metadata.
 *
 * @param key The public key to export.
 * @returns The public JWK with key ID, usage, and algorithm metadata.
 */
export async function exportPublicKey(key: CryptoKey) {
	const jwk = await crypto.subtle.exportKey("jwk", key);

	return {
		...jwk,
		kid: KEY_ID,
		use: "sig",
		alg: "ES256",
	};
}

/**
 * Derives the public JWK from a serialized private JWK.
 *
 * @param privateKey The serialized private JWK.
 * @returns The public JWK with OIDC metadata.
 */
export function getPublicJwk(privateKey: string) {
	const jwk = JSON.parse(privateKey) as JsonWebKey;

	return {
		kty: jwk.kty,
		crv: jwk.crv,
		x: jwk.x,
		y: jwk.y,
		kid: KEY_ID,
		use: "sig",
		alg: "ES256",
	};
}

/**
 * Signs data using an ECDSA P-256 private key.
 *
 * @param key The private signing key.
 * @param data The data to sign.
 * @returns The generated ECDSA signature.
 */
export async function sign(key: CryptoKey, data: Uint8Array) {
	const buffer = new ArrayBuffer(data.byteLength);
	new Uint8Array(buffer).set(data);

	return crypto.subtle.sign(SIGN_ALGORITHM, key, buffer);
}

/**
 * Returns the key ID used for the OIDC signing key.
 *
 * @returns The signing key ID.
 */
export function getKeyId() {
	return KEY_ID;
}
