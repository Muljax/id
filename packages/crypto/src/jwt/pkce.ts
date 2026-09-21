import { base64UrlEncode } from "../bytes/base64";
import { timingSafeEqual } from "../hashing/compare";

const encoder = new TextEncoder();

/**
 * Creates a PKCE code challenge from a code verifier.
 *
 * The code verifier is hashed using SHA-256 and encoded as an
 * unpadded Base64URL value.
 *
 * @param codeVerifier The PKCE code verifier.
 * @returns The SHA-256 PKCE code challenge.
 */
export async function createCodeChallenge(
	codeVerifier: string,
): Promise<string> {
	const data = encoder.encode(codeVerifier);

	const hash = await crypto.subtle.digest("SHA-256", data);

	return base64UrlEncode(new Uint8Array(hash));
}

/**
 * Verifies a PKCE code verifier against a code challenge.
 *
 * @param codeVerifier The PKCE code verifier to verify.
 * @param codeChallenge The expected code challenge.
 * @returns `true` when the verifier produces the expected challenge.
 */
export async function verifyCodeChallenge(
	codeVerifier: string,
	codeChallenge: string,
): Promise<boolean> {
	const expected = await createCodeChallenge(codeVerifier);

	return timingSafeEqual(expected, codeChallenge);
}
