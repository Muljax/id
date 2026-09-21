const encoder = new TextEncoder();

/**
 * Generates a cryptographically secure random token.
 *
 * @returns A 32-byte random token encoded as hexadecimal.
 */
export function generateToken(): string {
	const bytes = new Uint8Array(32);

	crypto.getRandomValues(bytes);

	return bytes.toHex();
}

/**
 * Hashes a token using SHA-256.
 *
 * @param token The token to hash.
 * @returns The SHA-256 hash encoded as hexadecimal.
 */
export async function hashToken(token: string): Promise<string> {
	const data = encoder.encode(token);

	const hash = await crypto.subtle.digest("SHA-256", data);

	return new Uint8Array(hash).toHex();
}
