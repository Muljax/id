import { describe, expect, test } from "bun:test";
import {
	base64Decode,
	base64Encode,
	base64UrlDecode,
	base64UrlEncode,
} from "../src/bytes";

describe("@id/crypto: Base64 & Base64URL Encoding/Decoding", () => {
	test("standard base64 encodes and decodes correctly", () => {
		const text = "Hello, World! 🚀";
		const bytes = new TextEncoder().encode(text);

		const encoded = base64Encode(bytes);
		expect(typeof encoded).toBe("string");

		const decoded = base64Decode(encoded);
		expect(new TextDecoder().decode(decoded)).toBe(text);
	});

	test("base64url encodes without padding and with URL-safe chars", () => {
		const bytes = new Uint8Array([251, 255, 254, 253, 252]);
		const urlEncoded = base64UrlEncode(bytes);

		expect(urlEncoded).not.toContain("+");
		expect(urlEncoded).not.toContain("/");
		expect(urlEncoded).not.toContain("=");

		const decoded = base64UrlDecode(urlEncoded);
		expect(Array.from(decoded)).toEqual(Array.from(bytes));
	});

	test("handles empty inputs", () => {
		const empty = new Uint8Array(0);
		expect(base64Encode(empty)).toBe("");
		expect(base64UrlEncode(empty)).toBe("");
		expect(Array.from(base64Decode(""))).toEqual([]);
		expect(Array.from(base64UrlDecode(""))).toEqual([]);
	});
});
