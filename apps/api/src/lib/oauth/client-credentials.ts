import type { Context } from "hono";

import { createDb } from "../../db";
import { emitNotification } from "../../lib/notifications/emitter";
import { ACCESS_TOKEN_DURATION, createAccessToken } from "./tokens";
import { authenticateClient } from "./client-auth";
import { createJwtAccessToken } from "./jwt-access-token";
import { invalidScope, unauthorizedClient } from "./responses";

type TokenRequestBody = Record<string, string | File>;

/**
 * Handles the OAuth 2.0 Client Credentials Grant (RFC 6749 Section 4.4).
 *
 * Authenticates the confidential client and issues a signed ES256 JWT access token
 * with requested/default scopes and audience.
 *
 * @param c The Hono request context.
 * @param body The parsed token request body.
 * @returns The OAuth token JSON response or an error response.
 */
export async function exchangeClientCredentials(
	c: Context<{ Bindings: Env }>,
	body: TokenRequestBody,
) {
	const db = createDb(c.env.DB);

	const authResult = await authenticateClient(c, body, db);

	if ("errorResponse" in authResult) {
		return authResult.errorResponse;
	}

	const { client } = authResult;

	if (client.clientType !== "confidential") {
		return unauthorizedClient(
			c,
			"Only confidential clients may use the client credentials grant.",
		);
	}

	const allowedScopes = client.scopes;
	let grantedScopes: string;

	if (typeof body.scope === "string" && body.scope.trim()) {
		const requestedScopes = body.scope.trim().split(/\s+/).filter(Boolean);

		for (const reqScope of requestedScopes) {
			if (!allowedScopes.includes(reqScope)) {
				return invalidScope(
					c,
					`The requested scope '${reqScope}' is not permitted for this client.`,
				);
			}
		}

		grantedScopes = requestedScopes.join(" ");
	} else {
		grantedScopes = client.scopes.join(" ");
	}

	const audience =
		typeof body.audience === "string" && body.audience.trim()
			? body.audience.trim()
			: typeof body.resource === "string" && body.resource.trim()
				? body.resource.trim()
				: client.id;

	const expiresInSeconds = ACCESS_TOKEN_DURATION / 1000;

	const jwtAccessToken = await createJwtAccessToken({
		privateKey: c.env.OIDC_PRIVATE_KEY,
		issuer: c.env.OIDC_ISSUER,
		clientId: client.id,
		sub: client.id,
		audience,
		scope: grantedScopes,
		expiresIn: expiresInSeconds,
	});

	// Record in database for token introspection and revocation tracking
	await createAccessToken(
		db,
		client.id,
		null,
		grantedScopes,
		undefined,
		jwtAccessToken,
	);

	await emitNotification(db, {
		target: "admins",
		type: "admin.m2m_token_issued",
		category: "security",
		severity: "info",
		title: "M2M Token Issued",
		message: `Client "${client.name}" obtained an M2M access token (${grantedScopes || "no scopes"}).`,
	});

	return c.json({
		access_token: jwtAccessToken,
		token_type: "Bearer",
		expires_in: expiresInSeconds,
		scope: grantedScopes,
	});
}
