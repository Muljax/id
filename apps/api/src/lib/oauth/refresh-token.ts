import { and, eq, isNull } from "drizzle-orm";
import type { Context } from "hono";

import { createDb } from "../../db";
import { oauthAccessTokens, oauthRefreshTokens } from "../../db/schema";
import {
	ACCESS_TOKEN_DURATION,
	createAccessToken,
	createRefreshToken,
} from "../../lib/oauth/tokens";
import { hashToken } from "../../lib/token";
import { authenticateClient } from "./client-auth";
import { invalidGrant, invalidRequest } from "./responses";

type TokenRequestBody = Record<string, string | File>;

export async function exchangeRefreshToken(
	c: Context<{ Bindings: Env }>,
	body: TokenRequestBody,
) {
	const refreshToken = body.refresh_token;

	if (typeof refreshToken !== "string" || !refreshToken) {
		return invalidRequest(c, "Missing required parameters.");
	}

	const db = createDb(c.env.DB);

	const authResult = await authenticateClient(c, body, db);

	if ("errorResponse" in authResult) {
		return authResult.errorResponse;
	}

	const { client } = authResult;

	const tokenHash = await hashToken(refreshToken);

	const result = await db
		.select()
		.from(oauthRefreshTokens)
		.where(eq(oauthRefreshTokens.tokenHash, tokenHash))
		.limit(1);

	const storedToken = result[0];

	if (!storedToken) {
		return invalidGrant(c);
	}

	const now = Date.now();

	if (storedToken.revokedAt !== null) {
		// RFC 6819 Section 5.2.2.3: Refresh token reuse detected!
		// Revoke all active access and refresh tokens for this grant.
		await db
			.update(oauthRefreshTokens)
			.set({ revokedAt: now })
			.where(
				and(
					eq(oauthRefreshTokens.userId, storedToken.userId),
					eq(oauthRefreshTokens.clientId, storedToken.clientId),
					isNull(oauthRefreshTokens.revokedAt),
				),
			);

		await db
			.update(oauthAccessTokens)
			.set({ revokedAt: now })
			.where(
				and(
					eq(oauthAccessTokens.userId, storedToken.userId),
					eq(oauthAccessTokens.clientId, storedToken.clientId),
					isNull(oauthAccessTokens.revokedAt),
				),
			);

		return invalidGrant(c);
	}

	if (storedToken.expiresAt <= now) {
		return invalidGrant(c);
	}

	if (storedToken.clientId !== client.id) {
		return invalidGrant(c);
	}

	const newRefreshToken = await createRefreshToken(
		db,
		client.id,
		storedToken.userId,
		storedToken.scope,
	);

	// Atomically revoke the old refresh token only if it hasn't been revoked yet
	const updated = await db
		.update(oauthRefreshTokens)
		.set({
			revokedAt: now,
			replacedBy: newRefreshToken.id,
		})
		.where(
			and(
				eq(oauthRefreshTokens.id, storedToken.id),
				isNull(oauthRefreshTokens.revokedAt),
			),
		)
		.returning({ id: oauthRefreshTokens.id });

	if (updated.length === 0) {
		// Concurrent request already rotated this token. Invalidate the newly generated token.
		await db
			.delete(oauthRefreshTokens)
			.where(eq(oauthRefreshTokens.id, newRefreshToken.id));

		return invalidGrant(c);
	}

	const accessToken = await createAccessToken(
		db,
		client.id,
		storedToken.userId,
		storedToken.scope,
	);

	return c.json({
		access_token: accessToken.token,
		token_type: "Bearer",
		expires_in: ACCESS_TOKEN_DURATION / 1000,
		refresh_token: newRefreshToken.token,
		scope: storedToken.scope,
	});
}
