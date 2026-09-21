import { describe, expect, test } from "bun:test";
import { arrayBufferToBase64, base64ToUint8Array } from "../src/webauthn";

describe("@id/crypto: WebAuthn Encoding Helpers", () => {
	test("arrayBufferToBase64 and base64ToUint8Array roundtrip", () => {
		const original = new Uint8Array([10, 20, 30, 40, 50, 60]);
		const b64 = arrayBufferToBase64(original);

		expect(typeof b64).toBe("string");

		const restored = base64ToUint8Array(b64);
		expect(Array.from(restored)).toEqual(Array.from(original));
	});

	test("arrayBufferToBase64 handles ArrayBuffer instance", () => {
		const buffer = new Uint8Array([1, 2, 3]).buffer;
		const b64 = arrayBufferToBase64(buffer);
		expect(typeof b64).toBe("string");
		expect(Array.from(base64ToUint8Array(b64))).toEqual([1, 2, 3]);
	});
});
