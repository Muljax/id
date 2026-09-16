const encoder = new TextEncoder();

/**
 * Compares two strings or byte arrays in constant time to prevent timing attacks.
 *
 * Both values are hashed with SHA-256 to guarantee identical fixed-length buffers (32 bytes),
 * preventing timing side-channels on both input length and character position.
 *
 * @param a First value to compare.
 * @param b Second value to compare.
 * @returns `true` if the values are equal; otherwise `false`.
 */
export async function timingSafeEqual(
	a: string | Uint8Array,
	b: string | Uint8Array,
): Promise<boolean> {
	const bytesA = typeof a === "string" ? encoder.encode(a) : a;
	const bytesB = typeof b === "string" ? encoder.encode(b) : b;

	const hashA = new Uint8Array(await crypto.subtle.digest("SHA-256", bytesA));
	const hashB = new Uint8Array(await crypto.subtle.digest("SHA-256", bytesB));

	if (
		"timingSafeEqual" in crypto.subtle &&
		typeof crypto.subtle.timingSafeEqual === "function"
	) {
		return crypto.subtle.timingSafeEqual(hashA, hashB);
	}

	if (
		"timingSafeEqual" in crypto &&
		typeof (
			crypto as unknown as {
				timingSafeEqual?: (x: ArrayBufferView, y: ArrayBufferView) => boolean;
			}
		).timingSafeEqual === "function"
	) {
		return (
			crypto as unknown as {
				timingSafeEqual: (x: ArrayBufferView, y: ArrayBufferView) => boolean;
			}
		).timingSafeEqual(hashA, hashB);
	}

	let diff = 0;
	for (let i = 0; i < hashA.length; i++) {
		diff |= hashA[i] ^ hashB[i];
	}

	return diff === 0;
}
