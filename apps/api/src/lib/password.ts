import { argon2id, argon2Verify, setWASMModules } from "argon2-wasm-edge";

// @ts-expect-error Cloudflare Workers WASM module import
import argon2WASM from "argon2-wasm-edge/wasm/argon2.wasm";

// @ts-expect-error Cloudflare Workers WASM module import
import blake2bWASM from "argon2-wasm-edge/wasm/blake2b.wasm";

setWASMModules({
	argon2WASM,
	blake2bWASM,
});

const SALT_LENGTH = 16;
const ARGON2_MEMORY_SIZE = 64 * 1024;
const ARGON2_ITERATIONS = 2;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;

/**
 * A structurally valid Argon2id hash matching the standard cost parameters (m=65536, t=2, p=1).
 * Used during authentication when a user is not found to ensure constant-time response
 * and prevent user enumeration timing attacks.
 */
export const DUMMY_PASSWORD_HASH =
	"$argon2id$v=19$m=65536,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/**
 * Hashes a password using Argon2id with a randomly generated salt.
 *
 * @param password The password to hash.
 * @returns The encoded Argon2id password hash.
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = new Uint8Array(SALT_LENGTH);
	crypto.getRandomValues(salt);

	return await argon2id({
		password,
		salt,
		memorySize: ARGON2_MEMORY_SIZE,
		iterations: ARGON2_ITERATIONS,
		parallelism: ARGON2_PARALLELISM,
		hashLength: ARGON2_HASH_LENGTH,
		outputType: "encoded",
	});
}

/**
 * Verifies a password against an Argon2id password hash.
 *
 * @param password The password to verify.
 * @param storedHash The stored Argon2id password hash.
 * @returns `true` when the password matches; otherwise, `false`.
 */
export async function verifyPassword(
	password: string,
	storedHash: string,
): Promise<boolean> {
	try {
		return await argon2Verify({
			password,
			hash: storedHash,
		});
	} catch {
		return false;
	}
}
