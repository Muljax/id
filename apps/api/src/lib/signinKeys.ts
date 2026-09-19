import { and, desc, eq, gt, isNull, or } from "drizzle-orm";

import type { Database } from "@/db";
import { type SigninKey, signinKeys, users } from "@/db/schema";
import { generateToken, hashToken } from "./token";

export interface CreateSigninKeyOptions {
	name: string;
	createdByUserId?: string | null;
	ttlHours?: number;
}

export interface CreateSigninKeyResult {
	id: string;
	name: string;
	key: string;
	keyPrefix: string;
	expiresAt: number | null;
	createdAt: number;
}

export interface VerifySigninKeyResult {
	valid: boolean;
	key?: SigninKey;
	error?: string;
}

/**
 * Creates and stores a new administrator access / sign-in key.
 */
export async function createSigninKey(
	db: Database,
	options: CreateSigninKeyOptions,
): Promise<CreateSigninKeyResult> {
	const rawToken = generateToken();
	const key = `id_key_${rawToken}`;
	const keyHash = await hashToken(key);
	const keyPrefix = `${key.slice(0, 15)}...`;
	const now = Date.now();
	const expiresAt = options.ttlHours
		? now + options.ttlHours * 60 * 60 * 1000
		: null;
	const id = crypto.randomUUID();

	await db.insert(signinKeys).values({
		id,
		name: options.name.trim(),
		keyHash,
		keyPrefix,
		createdByUserId: options.createdByUserId || null,
		expiresAt,
		createdAt: now,
	});

	return {
		id,
		name: options.name.trim(),
		key,
		keyPrefix,
		expiresAt,
		createdAt: now,
	};
}

/**
 * Verifies that a sign-in access key is valid and unexpired.
 */
export async function verifySigninKey(
	db: Database,
	key: string,
): Promise<VerifySigninKeyResult> {
	if (!key || typeof key !== "string") {
		return { valid: false, error: "Sign-in access key is required." };
	}

	const normalizedKey = key.trim();
	const keyHash = await hashToken(normalizedKey);
	const now = Date.now();

	const rows = await db
		.select()
		.from(signinKeys)
		.where(
			and(
				eq(signinKeys.keyHash, keyHash),
				or(isNull(signinKeys.expiresAt), gt(signinKeys.expiresAt, now)),
			),
		)
		.limit(1);

	const signinKeyRecord = rows[0];

	if (!signinKeyRecord) {
		return {
			valid: false,
			error: "Invalid or expired administrator access key.",
		};
	}

	// Update lastUsedAt timestamp asynchronously
	await db
		.update(signinKeys)
		.set({ lastUsedAt: now })
		.where(eq(signinKeys.id, signinKeyRecord.id));

	return {
		valid: true,
		key: signinKeyRecord,
	};
}

export interface AdminSigninKeyItem extends SigninKey {
	creatorEmail?: string | null;
}

/**
 * Lists sign-in keys for administrator configuration.
 */
export async function listSigninKeys(
	db: Database,
): Promise<AdminSigninKeyItem[]> {
	const rows = await db
		.select({
			id: signinKeys.id,
			name: signinKeys.name,
			keyHash: signinKeys.keyHash,
			keyPrefix: signinKeys.keyPrefix,
			createdByUserId: signinKeys.createdByUserId,
			expiresAt: signinKeys.expiresAt,
			lastUsedAt: signinKeys.lastUsedAt,
			createdAt: signinKeys.createdAt,
			creatorEmail: users.email,
		})
		.from(signinKeys)
		.leftJoin(users, eq(signinKeys.createdByUserId, users.id))
		.orderBy(desc(signinKeys.createdAt));

	return rows;
}

/**
 * Revokes / deletes a sign-in access key.
 */
export async function revokeSigninKey(
	db: Database,
	id: string,
): Promise<boolean> {
	await db.delete(signinKeys).where(eq(signinKeys.id, id));
	return true;
}
