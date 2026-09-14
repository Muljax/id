import { and, eq, gt, isNull } from "drizzle-orm";

import type { createDb } from "../db";
import { passkeyChallenges } from "../db/schema";

const CHALLENGE_DURATION = 5 * 60 * 1000;

/**
 * Encodes a byte array as a Base64 string.
 *
 * @param buffer The bytes to encode.
 * @returns The Base64-encoded value.
 */
export function arrayBufferToBase64(buffer: Uint8Array) {
	let binary = "";

	for (const byte of buffer) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary);
}

/**
 * Decodes a Base64 string into a byte array.
 *
 * @param value The Base64-encoded value to decode.
 * @returns The decoded byte array.
 */
export function base64ToUint8Array(value: string) {
	return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

/**
 * Creates a passkey challenge.
 *
 * Registration challenges are associated with a user because the user
 * is already authenticated. Authentication challenges are userless and
 * should be created with a null user ID.
 *
 * @param db The database connection.
 * @param userId The ID of the user, or null for userless authentication.
 * @param challenge The WebAuthn challenge value.
 * @returns The created challenge and its expiration timestamp.
 */
export async function createChallenge(
	db: ReturnType<typeof createDb>,
	userId: string | null,
	challenge: string,
) {
	const now = Date.now();
	const expiresAt = now + CHALLENGE_DURATION;
	const id = crypto.randomUUID();

	if (userId) {
		await db
			.delete(passkeyChallenges)
			.where(eq(passkeyChallenges.userId, userId));
	}

	await db.insert(passkeyChallenges).values({
		id,
		userId,
		challenge,
		expiresAt,
		createdAt: now,
	});

	return {
		id,
		challenge,
		expiresAt,
	};
}

/**
 * Retrieves the active passkey challenge for a user.
 *
 * This is used for authenticated passkey registration, where the
 * challenge is associated with the current user.
 *
 * @param db The database connection.
 * @param userId The ID of the user who owns the challenge.
 * @returns The active challenge, or null if none exists or it has expired.
 */
export async function getChallenge(
	db: ReturnType<typeof createDb>,
	userId: string,
) {
	const result = await db
		.select()
		.from(passkeyChallenges)
		.where(
			and(
				eq(passkeyChallenges.userId, userId),
				gt(passkeyChallenges.expiresAt, Date.now()),
			),
		)
		.orderBy(passkeyChallenges.createdAt)
		.limit(1);

	return result[0] ?? null;
}

/**
 * Retrieves an active userless passkey authentication challenge by ID.
 *
 * This is used during passkey login because the user may not be known
 * until the authenticator returns a credential.
 *
 * @param db The database connection.
 * @param id The challenge ID.
 * @returns The active authentication challenge, or null if it does not exist or has expired.
 */
export async function getChallengeById(
	db: ReturnType<typeof createDb>,
	id: string,
) {
	const result = await db
		.select()
		.from(passkeyChallenges)
		.where(
			and(
				eq(passkeyChallenges.id, id),
				isNull(passkeyChallenges.userId),
				gt(passkeyChallenges.expiresAt, Date.now()),
			),
		)
		.limit(1);

	return result[0] ?? null;
}

/**
 * Consumes a passkey registration challenge for a user atomically.
 *
 * The challenge is deleted in a single roundtrip via DELETE ... RETURNING *
 * so it cannot be reused or raced concurrently.
 *
 * @param db The database connection.
 * @param userId The ID of the user who owns the challenge.
 * @returns The consumed challenge, or null if none exists or has expired.
 */
export async function consumeChallenge(
	db: ReturnType<typeof createDb>,
	userId: string,
) {
	const deleted = await db
		.delete(passkeyChallenges)
		.where(
			and(
				eq(passkeyChallenges.userId, userId),
				gt(passkeyChallenges.expiresAt, Date.now()),
			),
		)
		.returning();

	return deleted[0] ?? null;
}

/**
 * Consumes a userless passkey authentication challenge by ID atomically.
 *
 * The challenge must not be associated with a user because the user
 * is identified from the credential returned by the authenticator.
 * The challenge is deleted in a single roundtrip via DELETE ... RETURNING *
 * so it cannot be reused or raced concurrently.
 *
 * @param db The database connection.
 * @param id The challenge ID.
 * @returns The consumed challenge, or null if none exists or has expired.
 */
export async function consumeChallengeById(
	db: ReturnType<typeof createDb>,
	id: string,
) {
	const deleted = await db
		.delete(passkeyChallenges)
		.where(
			and(
				eq(passkeyChallenges.id, id),
				isNull(passkeyChallenges.userId),
				gt(passkeyChallenges.expiresAt, Date.now()),
			),
		)
		.returning();

	return deleted[0] ?? null;
}
