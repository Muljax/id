import { eq } from "drizzle-orm";

import type { Database } from "../../db";
import { oauthAccessTokens, oauthRefreshTokens } from "../../db/schema";
import { generateToken, hashToken } from "../token";

/**
 * The lifetime of an OAuth access token in milliseconds.
 */
export const ACCESS_TOKEN_DURATION = 1000 * 60 * 60;

/**
 * The lifetime of an OAuth refresh token in milliseconds.
 */
export const REFRESH_TOKEN_DURATION = 1000 * 60 * 60 * 24 * 30;

/**
 * Creates and stores an OAuth access token.
 *
 * Only the hash of the token is stored in the database.
 *
 * @param db The database connection.
 * @param clientId The OAuth client ID.
 * @param userId The ID of the user the token belongs to.
 * @param scope The scopes granted to the token.
 * @param authorizationCodeId The authorization code that issued the token.
 * @returns The plaintext access token and its expiration time.
 */
export async function createAccessToken(
	db: Database,
	clientId: string,
	userId: string | null,
	scope: string,
	authorizationCodeId?: string,
	tokenString?: string,
) {
	const token = tokenString ?? generateToken();
	const now = Date.now();
	const expiresAt = now + ACCESS_TOKEN_DURATION;

	await db.insert(oauthAccessTokens).values({
		id: crypto.randomUUID(),
		clientId,
		userId,
		authorizationCodeId: authorizationCodeId ?? null,
		tokenHash: await hashToken(token),
		scope,
		expiresAt,
		createdAt: now,
		revokedAt: null,
	});

	return {
		token,
		expiresAt,
	};
}

/**
 * Creates and stores an OAuth refresh token.
 *
 * Only the hash of the token is stored in the database.
 *
 * @param db The database connection.
 * @param clientId The OAuth client ID.
 * @param userId The ID of the user the token belongs to.
 * @param scope The scopes granted to the token.
 * @returns The refresh token ID, plaintext token, and expiration time.
 */
export async function createRefreshToken(
	db: Database,
	clientId: string,
	userId: string,
	scope: string,
) {
	const token = generateToken();
	const id = crypto.randomUUID();
	const now = Date.now();
	const expiresAt = now + REFRESH_TOKEN_DURATION;

	await db.insert(oauthRefreshTokens).values({
		id,
		clientId,
		userId,
		tokenHash: await hashToken(token),
		scope,
		expiresAt,
		createdAt: now,
	});

	return {
		id,
		token,
		expiresAt,
	};
}

/**
 * Retrieves an active OAuth access token by its plaintext value.
 *
 * Expired and revoked tokens are treated as invalid.
 *
 * @param db The database connection.
 * @param token The plaintext access token.
 * @returns The access token record, or `null` when it is missing, expired, or revoked.
 */
export async function getAccessToken(db: Database, token: string) {
	const tokenHash = await hashToken(token);

	const result = await db
		.select()
		.from(oauthAccessTokens)
		.where(eq(oauthAccessTokens.tokenHash, tokenHash))
		.limit(1);

	const accessToken = result[0];

	if (!accessToken) {
		return null;
	}

	if (accessToken.expiresAt <= Date.now() || accessToken.revokedAt !== null) {
		return null;
	}

	return accessToken;
}

/**
 * Retrieves an active OAuth refresh token by its plaintext value.
 *
 * Expired and revoked tokens are treated as invalid.
 *
 * @param db The database connection.
 * @param token The plaintext refresh token.
 * @returns The refresh token record, or `null` when it is missing, expired, or revoked.
 */
export async function getRefreshToken(db: Database, token: string) {
	const tokenHash = await hashToken(token);

	const result = await db
		.select()
		.from(oauthRefreshTokens)
		.where(eq(oauthRefreshTokens.tokenHash, tokenHash))
		.limit(1);

	const refreshToken = result[0];

	if (!refreshToken) {
		return null;
	}

	if (refreshToken.expiresAt <= Date.now() || refreshToken.revokedAt !== null) {
		return null;
	}

	return refreshToken;
}

/**
 * Revokes an OAuth access token.
 *
 * @param db The database connection.
 * @param token The plaintext access token to revoke.
 */
export async function revokeAccessToken(db: Database, token: string) {
	const tokenHash = await hashToken(token);

	await db
		.update(oauthAccessTokens)
		.set({
			revokedAt: Date.now(),
		})
		.where(eq(oauthAccessTokens.tokenHash, tokenHash));
}

/**
 * Revokes an OAuth refresh token.
 *
 * @param db The database connection.
 * @param token The plaintext refresh token to revoke.
 */
export async function revokeRefreshToken(db: Database, token: string) {
	const tokenHash = await hashToken(token);

	await db
		.update(oauthRefreshTokens)
		.set({
			revokedAt: Date.now(),
		})
		.where(eq(oauthRefreshTokens.tokenHash, tokenHash));
}
