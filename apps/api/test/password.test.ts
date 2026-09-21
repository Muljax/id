import { describe, expect, test } from "bun:test";
import {
	DUMMY_PASSWORD_HASH,
	hashPassword,
	verifyPassword,
} from "../src/lib/password";

describe("Password Hashing & Verification (Argon2id)", () => {
	test("hashPassword produces valid Argon2id encoded string", async () => {
		const password = "correct-horse-battery-staple-99";
		const hash = await hashPassword(password);

		expect(typeof hash).toBe("string");
		expect(hash.startsWith("$argon2id$v=19$m=19456,t=2,p=1$")).toBe(true);
	});

	test("verifyPassword returns true for matching password and hash", async () => {
		const password = "mySecurePassword!123";
		const hash = await hashPassword(password);

		const isValid = await verifyPassword(password, hash);
		expect(isValid).toBe(true);
	});

	test("verifyPassword returns false for wrong password", async () => {
		const password = "mySecurePassword!123";
		const hash = await hashPassword(password);

		const isValid = await verifyPassword("wrongPassword!123", hash);
		expect(isValid).toBe(false);
	});

	test("verifyPassword safely verifies against DUMMY_PASSWORD_HASH without error", async () => {
		const isValid = await verifyPassword(
			"any-attempted-password",
			DUMMY_PASSWORD_HASH,
		);
		expect(isValid).toBe(false);
	});

	test("verifyPassword handles malformed or invalid hash gracefully", async () => {
		expect(await verifyPassword("password", "invalid-hash")).toBe(false);
		expect(await verifyPassword("password", "")).toBe(false);
		expect(await verifyPassword("password", "$argon2id$corrupted")).toBe(false);
	});
});
