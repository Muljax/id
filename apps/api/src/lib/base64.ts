/**
 * Encodes bytes as a URL-safe Base64 string without padding.
 *
 * @param bytes The bytes to encode.
 * @returns The Base64URL-encoded value.
 */
export function base64UrlEncode(bytes: Uint8Array): string {
	return bytes.toBase64({ alphabet: "base64url", omitPadding: true });
}

/**
 * Decodes a URL-safe Base64 string into a byte array.
 *
 * @param value The Base64URL string to decode.
 * @returns The decoded byte array.
 */
export function base64UrlDecode(value: string): Uint8Array {
	return Uint8Array.fromBase64(value, { alphabet: "base64url" });
}

/**
 * Encodes bytes as a standard Base64 string.
 *
 * @param bytes The bytes to encode.
 * @param omitPadding Whether to omit padding characters (`=`).
 * @returns The Base64-encoded string.
 */
export function base64Encode(bytes: Uint8Array, omitPadding = false): string {
	return bytes.toBase64({ alphabet: "base64", omitPadding });
}

/**
 * Decodes a standard Base64 string into a byte array.
 *
 * @param value The Base64 string to decode.
 * @returns The decoded byte array.
 */
export function base64Decode(value: string): Uint8Array {
	return Uint8Array.fromBase64(value, { alphabet: "base64" });
}
