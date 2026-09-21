import { base64Encode } from "../bytes/base64";

/**
 * Encodes a byte array as a Base64 string.
 *
 * @param buffer The bytes to encode.
 * @returns The Base64-encoded value.
 */
export function arrayBufferToBase64(buffer: Uint8Array | ArrayBuffer): string {
	const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	return base64Encode(uint8);
}

/**
 * Decodes a Base64 string into a byte array backed by an ArrayBuffer.
 *
 * @param value The Base64-encoded value to decode.
 * @returns The decoded byte array.
 */
export function base64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
	return new Uint8Array(Uint8Array.fromBase64(value));
}
