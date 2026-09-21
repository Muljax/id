import type { Context } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import {
	type AuthorizationRequest,
	validateAuthorizationRequest,
} from "@/lib/oauth/authorization";
import { hasOAuthGrant } from "@/lib/oauth/grant";
import { base64UrlDecode } from "@/lib/base64";
import { getDashboardOrigin } from "@/lib/env";
import { isUserAdmin } from "@/lib/rbac/permissions";
import { getSessionUserWithSession } from "@/lib/session";
import { getOrCreateInstanceSettings } from "@/lib/settings";
import { isUserDisabled } from "@/lib/user";

interface RequestObjectClaims {
	client_id?: string;
	redirect_uri?: string;
	response_type?: string | string[];
	scope?: string;
	state?: string;
	nonce?: string;
	prompt?: string;
	max_age?: number | string;
	acr_values?: string;
	claims?: string;
	code_challenge?: string;
	code_challenge_method?: string;
}

function decodeRequestObject(request: string): RequestObjectClaims {
	const parts = request.split(".");

	if (parts.length !== 3) {
		throw new Error("Invalid request object: must have 3 segments");
	}

	const [encodedHeader, encodedPayload, encodedSignature] = parts;

	if (encodedSignature !== "") {
		throw new Error("Request object must use an empty signature");
	}

	const textDecoder = new TextDecoder();

	const header = JSON.parse(
		textDecoder.decode(base64UrlDecode(encodedHeader)),
	) as { alg?: string };

	if (header.alg !== "none") {
		throw new Error("Unsupported request object algorithm");
	}

	const payload = JSON.parse(
		textDecoder.decode(base64UrlDecode(encodedPayload)),
	) as RequestObjectClaims;

	return payload;
}

function redirectWithError(
	redirectUri: string,
	error: string,
	state?: string,
	errorDescription?: string,
) {
	try {
		const url = new URL(redirectUri);

		url.searchParams.set("error", error);

		if (errorDescription) {
			url.searchParams.set("error_description", errorDescription);
		}

		if (state) {
			url.searchParams.set("state", state);
		}

		return Response.redirect(url.toString(), 302);
	} catch {
		return Response.json(
			{
				error,
				...(errorDescription ? { error_description: errorDescription } : {}),
			},
			{ status: 400 },
		);
	}
}

export interface RawAuthorizationParams {
	client_id?: string;
	redirect_uri?: string;
	response_type?: string;
	scope?: string;
	state?: string;
	nonce?: string;
	prompt?: string;
	max_age?: string;
	acr_values?: string;
	claims?: string;
	code_challenge?: string;
	code_challenge_method?: string;
	request?: string;
}

export async function handleAuthorizationRequest(
	c: Context<{ Bindings: Env }>,
	rawParams: RawAuthorizationParams,
) {
	try {
		let requestClaims: RequestObjectClaims = {};

		if (rawParams.request) {
			try {
				requestClaims = decodeRequestObject(rawParams.request);
			} catch (e) {
				return c.json(
					{
						error: "invalid_request_object",
						error_description:
							e instanceof Error ? e.message : "Invalid request object.",
					},
					400,
				);
			}
		}

		const clientId = requestClaims.client_id ?? rawParams.client_id;
		const redirectUri = requestClaims.redirect_uri ?? rawParams.redirect_uri;
		const responseType = requestClaims.response_type ?? rawParams.response_type;
		const scope = requestClaims.scope ?? rawParams.scope;
		const state = requestClaims.state ?? rawParams.state;
		const nonce = requestClaims.nonce ?? rawParams.nonce;
		const prompt = requestClaims.prompt ?? rawParams.prompt;

		const maxAge =
			requestClaims.max_age !== undefined
				? String(requestClaims.max_age)
				: rawParams.max_age;

		const acrValues =
			requestClaims.acr_values !== undefined
				? requestClaims.acr_values
				: rawParams.acr_values;

		const claims =
			requestClaims.claims !== undefined
				? requestClaims.claims
				: rawParams.claims;

		const codeChallenge =
			requestClaims.code_challenge ?? rawParams.code_challenge;

		const codeChallengeMethod =
			requestClaims.code_challenge_method ?? rawParams.code_challenge_method;

		const normalizedResponseType = Array.isArray(responseType)
			? responseType.join(" ")
			: responseType;

		const request: AuthorizationRequest = {
			client_id: clientId ?? "",
			redirect_uri: redirectUri ?? "",
			response_type: normalizedResponseType ?? "",
			scope: scope ?? "",
			state,
			nonce,
			code_challenge: codeChallenge,
			code_challenge_method: codeChallengeMethod,
			acr_values: acrValues,
			claims,
		};

		const db = createDb(c.env.DB);
		const validation = await validateAuthorizationRequest(db, request);

		if ("error" in validation) {
			if (validation.redirectable) {
				return redirectWithError(
					request.redirect_uri,
					validation.error,
					request.state,
					validation.error_description,
				);
			}

			return c.json(
				{
					error: validation.error,
					error_description: validation.error_description,
				},
				400,
			);
		}

		const settings = await getOrCreateInstanceSettings(db);

		if (settings.signinMode === "disabled") {
			return redirectWithError(
				request.redirect_uri,
				"temporarily_unavailable",
				request.state,
				"Authentication and OAuth authorizations are currently disabled on this instance.",
			);
		}

		if (maxAge !== undefined) {
			const parsedMaxAge = Number(maxAge);

			if (!Number.isInteger(parsedMaxAge) || parsedMaxAge < 0) {
				return redirectWithError(
					request.redirect_uri,
					"invalid_request",
					request.state,
					"The max_age parameter must be a non-negative integer.",
				);
			}
		}

		const sessionToken = getCookie(c, "session");

		const sessionRecord = sessionToken
			? await getSessionUserWithSession(db, sessionToken)
			: null;

		const authenticationAge = sessionRecord
			? Math.floor(Date.now() / 1000) -
				Math.floor(sessionRecord.session.createdAt / 1000)
			: null;

		const maxAgeExpired =
			maxAge !== undefined &&
			(authenticationAge === null || authenticationAge >= Number(maxAge));

		let requiresLogin =
			!sessionRecord || isUserDisabled(sessionRecord.user) || maxAgeExpired;

		if (
			!requiresLogin &&
			sessionRecord &&
			settings.signinMode === "admin_key"
		) {
			const isAdmin = await isUserAdmin(db, sessionRecord.user.id);
			if (!isAdmin) {
				requiresLogin = true;
			}
		}

		if (prompt === "none") {
			if (requiresLogin || !sessionRecord) {
				return redirectWithError(
					request.redirect_uri,
					"login_required",
					request.state,
				);
			}

			const hasGrant = await hasOAuthGrant(
				db,
				sessionRecord.user.id,
				validation.client.id,
				validation.scopes,
			);

			if (!hasGrant) {
				return redirectWithError(
					request.redirect_uri,
					"consent_required",
					request.state,
					"Consent is required for prompt=none.",
				);
			}
		}

		const authorizeUrl = new URL(`${getDashboardOrigin(c.env)}/authorize`);

		authorizeUrl.searchParams.set("client_id", request.client_id);
		authorizeUrl.searchParams.set("redirect_uri", request.redirect_uri);
		authorizeUrl.searchParams.set("response_type", "code");
		authorizeUrl.searchParams.set("scope", validation.scopes.join(" "));

		if (request.state !== undefined) {
			authorizeUrl.searchParams.set("state", request.state);
		}

		if (request.nonce !== undefined) {
			authorizeUrl.searchParams.set("nonce", request.nonce);
		}

		if (request.acr_values !== undefined) {
			authorizeUrl.searchParams.set("acr_values", request.acr_values);
		}

		if (request.claims !== undefined) {
			authorizeUrl.searchParams.set("claims", request.claims);
		}

		if (requiresLogin) {
			authorizeUrl.searchParams.set("prompt", "login");
		} else if (prompt !== undefined) {
			authorizeUrl.searchParams.set("prompt", prompt);
		}

		if (maxAge !== undefined) {
			authorizeUrl.searchParams.set("max_age", maxAge);
		}

		if (request.code_challenge !== undefined) {
			authorizeUrl.searchParams.set("code_challenge", request.code_challenge);
		}

		if (request.code_challenge_method !== undefined) {
			authorizeUrl.searchParams.set(
				"code_challenge_method",
				request.code_challenge_method,
			);
		}

		return c.redirect(authorizeUrl.toString(), 302);
	} catch (error) {
		console.error("OAuth authorization error:", error);

		return c.json(
			{
				error: "server_error",
			},
			500,
		);
	}
}
