import { describe, expect, test } from "bun:test";
import {
	DUMMY_PASSWORD_HASH,
	generateToken,
	hashPassword,
	hashToken,
	timingSafeEqual,
	verifyPassword,
} from "../src/hashing";

describe("@id/crypto: Hashing and TimingSafeEqual", () => {
	test("timingSafeEqual returns true for identical strings and buffers", async () => {
		expect(await timingSafeEqual("supersecret123", "supersecret123")).toBe(
			true,
		);
		expect(await timingSafeEqual("", "")).toBe(true);
		expect(await timingSafeEqual("unicode-🚀-token", "unicode-🚀-token")).toBe(
			true,
		);

		const a = new Uint8Array([1, 2, 3, 4]);
		const b = new Uint8Array([1, 2, 3, 4]);
		expect(await timingSafeEqual(a, b)).toBe(true);
	});

	test("timingSafeEqual returns false for different inputs", async () => {
		expect(await timingSafeEqual("secretA", "secretB")).toBe(false);
		expect(await timingSafeEqual("short", "longerstring")).toBe(false);

		const a = new Uint8Array([1, 2, 3, 4]);
		const b = new Uint8Array([1, 2, 3, 5]);
		expect(await timingSafeEqual(a, b)).toBe(false);
	});

	test("generateToken produces a 64-character hexadecimal token", () => {
		const token = generateToken();
		expect(typeof token).toBe("string");
		expect(token.length).toBe(64);
		expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
	});

	test("hashToken computes deterministic SHA-256 hex string", async () => {
		expect(await hashToken("")).toBe(
			"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		);
		expect(await hashToken("test")).toBe(
			"9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
		);
	});

	test("hashPassword produces valid Argon2id string and verifies", async () => {
		const password = "mySecurePassword!123";
		const hash = await hashPassword(password);

		expect(typeof hash).toBe("string");
		expect(hash.startsWith("$argon2id$v=19$m=19456,t=2,p=1$")).toBe(true);

		expect(await verifyPassword(password, hash)).toBe(true);
		expect(await verifyPassword("wrongPassword", hash)).toBe(false);
		expect(await verifyPassword("any-attempt", DUMMY_PASSWORD_HASH)).toBe(
			false,
		);
	});
});
