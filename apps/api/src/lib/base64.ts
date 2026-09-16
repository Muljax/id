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
