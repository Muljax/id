import { describe, expect, test } from "bun:test";
import { timingSafeEqual } from "../src/lib/crypto";

describe("Crypto & Constant-Time TimingSafeEqual Utilities", () => {
	test("timingSafeEqual returns true for identical strings", async () => {
		expect(await timingSafeEqual("supersecret123", "supersecret123")).toBe(
			true,
		);
		expect(await timingSafeEqual("", "")).toBe(true);
		expect(await timingSafeEqual("unicode-🚀-token", "unicode-🚀-token")).toBe(
			true,
		);
	});

	test("timingSafeEqual returns false for different strings", async () => {
		expect(await timingSafeEqual("secretA", "secretB")).toBe(false);
		expect(await timingSafeEqual("short", "longerstring")).toBe(false);
		expect(
			await timingSafeEqual(
				"exact_match_except_last_a",
				"exact_match_except_last_b",
			),
		).toBe(false);
		expect(
			await timingSafeEqual(
				"a_exact_match_except_first",
				"b_exact_match_except_first",
			),
		).toBe(false);
		expect(await timingSafeEqual("token", "")).toBe(false);
		expect(await timingSafeEqual("", "token")).toBe(false);
	});

	test("timingSafeEqual returns true for identical Uint8Arrays", async () => {
		const a = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
		const b = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
		expect(await timingSafeEqual(a, b)).toBe(true);

		const emptyA = new Uint8Array(0);
		const emptyB = new Uint8Array(0);
		expect(await timingSafeEqual(emptyA, emptyB)).toBe(true);
	});

	test("timingSafeEqual returns false for different Uint8Arrays", async () => {
		const a = new Uint8Array([1, 2, 3, 4]);
		const b = new Uint8Array([1, 2, 3, 5]);
		const c = new Uint8Array([1, 2, 3]);

		expect(await timingSafeEqual(a, b)).toBe(false);
		expect(await timingSafeEqual(a, c)).toBe(false);
	});

	test("timingSafeEqual handles mixed string and Uint8Array inputs", async () => {
		const text = "consistent-payload";
		const bytes = new TextEncoder().encode(text);
		const differentBytes = new TextEncoder().encode("different-payload");

		expect(await timingSafeEqual(text, bytes)).toBe(true);
		expect(await timingSafeEqual(bytes, text)).toBe(true);
		expect(await timingSafeEqual(text, differentBytes)).toBe(false);
	});
});
