import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "../../db";
import {
	oauthAccessTokens,
	oauthGrants,
	oauthRefreshTokens,
} from "../../db/schema";

function parseGrantScopes(scopes: string): string[] {
	try {
		const parsed: unknown = JSON.parse(scopes);

		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.filter((scope): scope is string => typeof scope === "string");
	} catch {
		return [];
	}
}

/**
 * Gets the OAuth grant for a user and client.
 *
 * Revoked grants are returned as well so callers can distinguish
 * between an active grant and a revoked one.
 *
 * @param db The database connection.
 * @param userId The ID of the user.
 * @param clientId The OAuth client ID.
 */
export async function getOAuthGrant(
	db: Database,
	userId: string,
	clientId: string,
) {
	const result = await db
		.select()
		.from(oauthGrants)
		.where(
			and(eq(oauthGrants.userId, userId), eq(oauthGrants.clientId, clientId)),
		)
		.limit(1);

	return result[0] ?? null;
}

/**
 * Checks whether an active OAuth grant contains all requested scopes.
 *
 * @param db The database connection.
 * @param userId The ID of the user.
 * @param clientId The OAuth client ID.
 * @param scopes The requested scopes.
 */
export async function hasOAuthGrant(
	db: Database,
	userId: string,
	clientId: string,
	scopes: string[],
) {
	const grant = await getOAuthGrant(db, userId, clientId);

	if (!grant || grant.revokedAt !== null) {
		return false;
	}

	const grantedScopes = new Set(parseGrantScopes(grant.scopes));

	return scopes.every((scope) => grantedScopes.has(scope));
}

/**
 * Grants OAuth access to a client for a user.
 *
 * An existing grant is updated and unrevoked instead of creating a duplicate.
 *
 * @param db The database connection.
 * @param input The user, client, and scopes to grant.
 */
export async function grantOAuthAccess(
	db: Database,
	input: {
		userId: string;
		clientId: string;
		scopes: string[];
	},
) {
	const now = Date.now();

	const existing = await db
		.select()
		.from(oauthGrants)
		.where(
			and(
				eq(oauthGrants.userId, input.userId),
				eq(oauthGrants.clientId, input.clientId),
			),
		)
		.limit(1);

	if (existing[0]) {
		const existingScopes = parseGrantScopes(existing[0].scopes);
		const scopes = [...new Set([...existingScopes, ...input.scopes])];

		await db
			.update(oauthGrants)
			.set({
				scopes: JSON.stringify(scopes),
				grantedAt: now,
				revokedAt: null,
			})
			.where(eq(oauthGrants.id, existing[0].id));

		return;
	}

	await db.insert(oauthGrants).values({
		id: crypto.randomUUID(),
		userId: input.userId,
		clientId: input.clientId,
		scopes: JSON.stringify(input.scopes),
		grantedAt: now,
	});
}

/**
 * Revokes OAuth access previously granted to a client.
 *
 * The grant and all active access and refresh tokens for the user and client
 * are revoked.
 *
 * @param db The database connection.
 * @param userId The ID of the user whose access should be revoked.
 * @param clientId The OAuth client ID whose access should be revoked.
 */
export async function revokeOAuthAccess(
	db: Database,
	userId: string,
	clientId: string,
) {
	const now = Date.now();

	await db
		.update(oauthGrants)
		.set({
			revokedAt: now,
		})
		.where(
			and(
				eq(oauthGrants.userId, userId),
				eq(oauthGrants.clientId, clientId),
				isNull(oauthGrants.revokedAt),
			),
		);

	await db
		.update(oauthAccessTokens)
		.set({
			revokedAt: now,
		})
		.where(
			and(
				eq(oauthAccessTokens.userId, userId),
				eq(oauthAccessTokens.clientId, clientId),
				isNull(oauthAccessTokens.revokedAt),
			),
		);

	await db
		.update(oauthRefreshTokens)
		.set({
			revokedAt: now,
		})
		.where(
			and(
				eq(oauthRefreshTokens.userId, userId),
				eq(oauthRefreshTokens.clientId, clientId),
				isNull(oauthRefreshTokens.revokedAt),
			),
		);
}
