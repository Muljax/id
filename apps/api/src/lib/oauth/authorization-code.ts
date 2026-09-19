import { and, eq, isNull } from "drizzle-orm";
import type { Context } from "hono";

import { createDb } from "../../db";
import { oauthAccessTokens, oauthAuthorizationCodes } from "../../db/schema";
import { validateRedirectUri } from "../../lib/oauth/client";
import { createIdToken } from "../../lib/oauth/id-token";
import { verifyCodeChallenge } from "../../lib/oauth/pkce";
import {
	ACCESS_TOKEN_DURATION,
	createAccessToken,
	createRefreshToken,
} from "../../lib/oauth/tokens";
import { hashToken } from "../../lib/token";
import { isUserAdmin } from "../rbac/permissions";
import { getOrCreateInstanceSettings } from "../settings";
import { authenticateClient } from "./client-auth";
import { invalidGrant, invalidRequest } from "./responses";

type TokenRequestBody = Record<string, string | File>;

export async function exchangeAuthorizationCode(
	c: Context<{ Bindings: Env }>,
	body: TokenRequestBody,
) {
	const code = body.code;
	const redirectUri = body.redirect_uri;
	const codeVerifier = body.code_verifier;

	if (typeof code !== "string" || typeof redirectUri !== "string") {
		return invalidRequest(c, "Missing required parameters.");
	}

	const db = createDb(c.env.DB);

	const authResult = await authenticateClient(c, body, db);

	if ("errorResponse" in authResult) {
		return authResult.errorResponse;
	}

	const { client } = authResult;

	if (!validateRedirectUri(client, redirectUri)) {
		return invalidGrant(c);
	}

	const codeHash = await hashToken(code);

	const result = await db
		.select()
		.from(oauthAuthorizationCodes)
		.where(eq(oauthAuthorizationCodes.codeHash, codeHash))
		.limit(1);

	const authorizationCode = result[0];

	if (!authorizationCode) {
		return invalidGrant(c);
	}

	const settings = await getOrCreateInstanceSettings(db);
	if (settings.signinMode === "disabled") {
		const isAdmin = await isUserAdmin(db, authorizationCode.userId);
		if (!isAdmin) {
			return invalidGrant(
				c,
				"Authentication and token exchanges are disabled on this instance.",
			);
		}
	}

	const now = Date.now();

	if (authorizationCode.usedAt !== null) {
		// RFC 6749 Section 4.1.2: Code reuse detected. Revoke previously issued tokens.
		await db
			.update(oauthAccessTokens)
			.set({
				revokedAt: now,
			})
			.where(eq(oauthAccessTokens.authorizationCodeId, authorizationCode.id));

		return invalidGrant(c);
	}

	if (authorizationCode.expiresAt <= now) {
		return invalidGrant(c);
	}

	if (
		authorizationCode.clientId !== client.id ||
		authorizationCode.redirectUri !== redirectUri
	) {
		return invalidGrant(c);
	}

	const codeChallenge = authorizationCode.codeChallenge;

	// PKCE is mandatory for public clients (OAuth 2.1) or when code_challenge was provided
	if (client.clientType === "public" || codeChallenge !== null) {
		if (typeof codeVerifier !== "string" || !codeChallenge) {
			return invalidRequest(c, "The code_verifier parameter is required.");
		}

		const validCodeVerifier = await verifyCodeChallenge(
			codeVerifier,
			codeChallenge,
		);

		if (!validCodeVerifier) {
			return invalidGrant(c);
		}
	}

	const updated = await db
		.update(oauthAuthorizationCodes)
		.set({
			usedAt: now,
		})
		.where(
			and(
				eq(oauthAuthorizationCodes.id, authorizationCode.id),
				isNull(oauthAuthorizationCodes.usedAt),
			),
		)
		.returning({
			id: oauthAuthorizationCodes.id,
		});

	if (updated.length === 0) {
		return invalidGrant(c);
	}

	const accessToken = await createAccessToken(
		db,
		client.id,
		authorizationCode.userId,
		authorizationCode.scope,
		authorizationCode.id,
	);

	const refreshToken = await createRefreshToken(
		db,
		client.id,
		authorizationCode.userId,
		authorizationCode.scope,
	);

	const idToken = await createIdToken({
		privateKey: c.env.OIDC_PRIVATE_KEY,
		issuer: c.env.OIDC_ISSUER,
		clientId: client.id,
		userId: authorizationCode.userId,
		nonce: authorizationCode.nonce ?? undefined,
		authTime: authorizationCode.authTime ?? undefined,
		acr: authorizationCode.acr ?? undefined,
		expiresIn: ACCESS_TOKEN_DURATION / 1000,
	});

	return c.json({
		access_token: accessToken.token,
		token_type: "Bearer",
		expires_in: ACCESS_TOKEN_DURATION / 1000,
		refresh_token: refreshToken.token,
		id_token: idToken,
		scope: authorizationCode.scope,
	});
}
