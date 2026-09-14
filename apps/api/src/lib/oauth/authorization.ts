import type { Database } from "../../db";
import { oauthAuthorizationCodes } from "../../db/schema";
import {
	clientSupportsScopes,
	getOAuthClient,
	validateRedirectUri,
} from "./client";
import { grantOAuthAccess } from "./grant";
import { hashToken } from "../token";

const AUTHORIZATION_CODE_DURATION = 60 * 1000;

export interface AuthorizationRequest {
	client_id: string;
	redirect_uri: string;
	response_type: string;
	scope: string;
	state?: string;
	nonce?: string;
	code_challenge?: string;
	code_challenge_method?: string;
	acr_values?: string;
	claims?: string;
}

export async function validateAuthorizationRequest(
	db: Database,
	request: AuthorizationRequest,
) {
	if (
		!request.client_id ||
		!request.redirect_uri ||
		!request.response_type ||
		!request.scope
	) {
		return {
			error: "invalid_request" as const,
			error_description: "Missing required parameters.",
		};
	}

	if (request.response_type !== "code") {
		return {
			error: "unsupported_response_type" as const,
			error_description: "Only the authorization code flow is supported.",
		};
	}

	const client = await getOAuthClient(db, request.client_id);

	if (!client) {
		return {
			error: "invalid_request" as const,
			error_description: "Unknown client.",
		};
	}

	if (!validateRedirectUri(client, request.redirect_uri)) {
		return {
			error: "invalid_request" as const,
			error_description: "Invalid redirect URI.",
		};
	}

	// PKCE is mandatory for public clients (OAuth 2.1) or if code_challenge is provided
	if (
		client.clientType === "public" ||
		request.code_challenge ||
		request.code_challenge_method
	) {
		if (!request.code_challenge) {
			return {
				error: "invalid_request" as const,
				error_description:
					client.clientType === "public"
						? "Public clients must use PKCE (code_challenge is required)."
						: "The code_challenge parameter is required.",
			};
		}

		if (!request.code_challenge_method) {
			return {
				error: "invalid_request" as const,
				error_description: "The code_challenge_method parameter is required.",
			};
		}

		if (request.code_challenge_method !== "S256") {
			return {
				error: "invalid_request" as const,
				error_description: "Only S256 PKCE is supported.",
			};
		}

		if (!/^[A-Za-z0-9_-]{43}$/.test(request.code_challenge)) {
			return {
				error: "invalid_request" as const,
				error_description: "Invalid PKCE code challenge.",
			};
		}
	}

	const scopes = [...new Set(request.scope.split(" ").filter(Boolean))];

	if (scopes.length === 0) {
		return {
			error: "invalid_scope" as const,
			error_description: "At least one scope is required.",
		};
	}

	if (!scopes.includes("openid")) {
		return {
			error: "invalid_scope" as const,
			error_description: "The openid scope is required.",
		};
	}

	if (!clientSupportsScopes(client, scopes)) {
		return {
			error: "invalid_scope" as const,
			error_description: "One or more requested scopes are not allowed.",
		};
	}

	return {
		client,
		scopes,
	};
}

export async function createAuthorizationCode(
	db: Database,
	request: AuthorizationRequest,
	clientId: string,
	scopes: string[],
	userId: string,
	authTime: number,
) {
	await grantOAuthAccess(db, {
		userId,
		clientId,
		scopes,
	});

	const code = crypto.randomUUID();
	const codeHash = await hashToken(code);
	const now = Date.now();

	const acr = request.acr_values?.trim().split(/\s+/).filter(Boolean)[0];

	await db.insert(oauthAuthorizationCodes).values({
		id: crypto.randomUUID(),
		clientId,
		userId,
		codeHash,
		redirectUri: request.redirect_uri,
		scope: scopes.join(" "),
		nonce: request.nonce,
		codeChallenge: request.code_challenge,
		codeChallengeMethod: request.code_challenge_method,
		authTime,
		acr,
		claims: request.claims,
		expiresAt: now + AUTHORIZATION_CODE_DURATION,
		createdAt: now,
	});

	return code;
}
