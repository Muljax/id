import { describe, expect, test } from "bun:test";
import { generateToken, hashToken } from "../src/lib/token";

describe("Token Generation & Hashing Utilities", () => {
	test("generateToken produces a 64-character hexadecimal token", () => {
		const token = generateToken();
		expect(typeof token).toBe("string");
		expect(token.length).toBe(64);
		expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
	});

	test("generateToken generates unique tokens with high entropy", () => {
		const tokens = new Set<string>();
		for (let i = 0; i < 50; i++) {
			tokens.add(generateToken());
		}
		expect(tokens.size).toBe(50);
	});

	test("hashToken computes deterministic SHA-256 hex string matching standard vectors", async () => {
		// SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
		expect(await hashToken("")).toBe(
			"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		);

		// SHA-256("test") = 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
		expect(await hashToken("test")).toBe(
			"9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
		);
	});
});
