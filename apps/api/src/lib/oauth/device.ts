import { and, eq } from "drizzle-orm";
import type { Context } from "hono";

import { createDb, type Database } from "../../db";
import { oauthClients, oauthDeviceCodes, oauthGrants } from "../../db/schema";
import { createIdToken } from "../../lib/oauth/id-token";
import {
	ACCESS_TOKEN_DURATION,
	createAccessToken,
	createRefreshToken,
} from "../../lib/oauth/tokens";
import { hashToken } from "../../lib/token";
import { isUserAdmin } from "../rbac/permissions";
import { getOrCreateInstanceSettings } from "../settings";
import { getDashboardOrigin } from "../env";
import { authenticateClient } from "./client-auth";
import { invalidGrant, invalidRequest, invalidScope } from "./responses";

/**
 * Character set used for RFC 8628 human-friendly user codes.
 * Omits ambiguous characters (0, O, 1, I, L) to avoid transcription errors.
 */
const USER_CODE_CHARS = "BCDFGHJKLMNPQRSTVWXZ23456789";

/**
 * Generates an 8-character human-friendly user code formatted as XXXX-XXXX.
 */
export function generateUserCode(): string {
	const bytes = new Uint8Array(8);
	crypto.getRandomValues(bytes);

	let code = "";
	for (let i = 0; i < 8; i++) {
		if (i === 4) {
			code += "-";
		}
		const charIndex = bytes[i] % USER_CODE_CHARS.length;
		code += USER_CODE_CHARS[charIndex];
	}
	return code;
}

/**
 * Normalizes user code inputs (strips whitespace/dashes and standardizes format).
 */
export function normalizeUserCode(input: string): string {
	const cleaned = input.replaceAll(/[^A-Za-z0-9]/g, "").toUpperCase();
	if (cleaned.length === 8) {
		return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
	}
	return cleaned;
}

/**
 * Generates a cryptographically random device verification code string.
 */
export function generateDeviceCode(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Initiates an OAuth 2.0 Device Authorization Request (RFC 8628 §3.1).
 */
export async function createDeviceAuthorization(
	c: Context<{ Bindings: Env }>,
	body: Record<string, unknown>,
) {
	const db = createDb(c.env.DB);
	const authResult = await authenticateClient(c, body, db);

	if ("errorResponse" in authResult) {
		return authResult.errorResponse;
	}

	const { client } = authResult;
	const requestedScope =
		typeof body.scope === "string" && body.scope.trim()
			? body.scope.trim()
			: "openid profile email";

	// Validate requested scopes against client authorized scopes
	const clientScopes = client.scopes;
	const requestedScopesList = requestedScope.split(" ").filter(Boolean);

	for (const s of requestedScopesList) {
		if (!clientScopes.includes(s)) {
			return invalidScope(
				c,
				`The requested scope '${s}' is not allowed for this client.`,
			);
		}
	}

	const deviceCode = generateDeviceCode();
	const userCode = generateUserCode();
	const deviceCodeHash = await hashToken(deviceCode);
	const now = Date.now();
	const expiresIn = 600; // 10 minutes in seconds
	const interval = 5; // 5 seconds polling interval

	const dashboardOrigin = c.env?.DASHBOARD_DOMAIN
		? getDashboardOrigin(c.env)
		: c.env?.OIDC_ISSUER || new URL(c.req.url).origin;
	const verificationUri = `${dashboardOrigin}/device`;
	const verificationUriComplete = `${verificationUri}?user_code=${encodeURIComponent(userCode)}`;

	await db.insert(oauthDeviceCodes).values({
		id: crypto.randomUUID(),
		clientId: client.id,
		deviceCodeHash,
		userCode,
		scope: requestedScope,
		status: "pending",
		pollingInterval: interval,
		expiresAt: now + expiresIn * 1000,
		createdAt: now,
	});

	return c.json(
		{
			device_code: deviceCode,
			user_code: userCode,
			verification_uri: verificationUri,
			verification_uri_complete: verificationUriComplete,
			expires_in: expiresIn,
			interval,
		},
		200,
	);
}

/**
 * Retrieves details of a device authorization request for user approval.
 */
export async function getDeviceCodeDetails(db: Database, rawUserCode: string) {
	const userCode = normalizeUserCode(rawUserCode);

	const result = await db
		.select({
			id: oauthDeviceCodes.id,
			clientId: oauthDeviceCodes.clientId,
			clientName: oauthClients.name,
			scope: oauthDeviceCodes.scope,
			status: oauthDeviceCodes.status,
			expiresAt: oauthDeviceCodes.expiresAt,
			createdAt: oauthDeviceCodes.createdAt,
		})
		.from(oauthDeviceCodes)
		.leftJoin(oauthClients, eq(oauthDeviceCodes.clientId, oauthClients.id))
		.where(eq(oauthDeviceCodes.userCode, userCode))
		.limit(1);

	const record = result[0];
	if (!record) {
		return null;
	}

	const expired = record.expiresAt <= Date.now();

	return {
		id: record.id,
		clientId: record.clientId,
		clientName: record.clientName || record.clientId || "CLI Client",
		scopes: record.scope.split(" ").filter(Boolean),
		status: record.status as "pending" | "approved" | "denied",
		expiresAt: record.expiresAt,
		expired,
	};
}

/**
 * Approves a pending device authorization code by an authenticated user.
 */
export async function approveDeviceCode(
	db: Database,
	rawUserCode: string,
	userId: string,
) {
	const userCode = normalizeUserCode(rawUserCode);
	const now = Date.now();

	const record = await db
		.select()
		.from(oauthDeviceCodes)
		.where(
			and(
				eq(oauthDeviceCodes.userCode, userCode),
				eq(oauthDeviceCodes.status, "pending"),
			),
		)
		.limit(1);

	const deviceCode = record[0];
	if (!deviceCode || deviceCode.expiresAt <= now) {
		return false;
	}

	// Update device authorization status to approved with user ID
	await db
		.update(oauthDeviceCodes)
		.set({
			status: "approved",
			userId,
		})
		.where(eq(oauthDeviceCodes.id, deviceCode.id));

	// Record persistent user grant decision
	const existingGrant = await db
		.select()
		.from(oauthGrants)
		.where(
			and(
				eq(oauthGrants.userId, userId),
				eq(oauthGrants.clientId, deviceCode.clientId),
			),
		)
		.limit(1);

	if (existingGrant.length === 0) {
		await db.insert(oauthGrants).values({
			id: crypto.randomUUID(),
			userId,
			clientId: deviceCode.clientId,
			scopes: deviceCode.scope,
			grantedAt: now,
		});
	}

	return true;
}

/**
 * Denies a pending device authorization code.
 */
export async function denyDeviceCode(db: Database, rawUserCode: string) {
	const userCode = normalizeUserCode(rawUserCode);
	const now = Date.now();

	const record = await db
		.select()
		.from(oauthDeviceCodes)
		.where(
			and(
				eq(oauthDeviceCodes.userCode, userCode),
				eq(oauthDeviceCodes.status, "pending"),
			),
		)
		.limit(1);

	const deviceCode = record[0];
	if (!deviceCode || deviceCode.expiresAt <= now) {
		return false;
	}

	await db
		.update(oauthDeviceCodes)
		.set({
			status: "denied",
		})
		.where(eq(oauthDeviceCodes.id, deviceCode.id));

	return true;
}

/**
 * Exchanges a device code for OAuth tokens via polling (RFC 8628 §3.4 & §3.5).
 */
export async function exchangeDeviceCode(
	c: Context<{ Bindings: Env }>,
	body: Record<string, string | File>,
) {
	const deviceCode = body.device_code;
	if (typeof deviceCode !== "string" || !deviceCode) {
		return invalidRequest(c, "The device_code parameter is required.");
	}

	const db = createDb(c.env.DB);
	const authResult = await authenticateClient(c, body, db);

	if ("errorResponse" in authResult) {
		return authResult.errorResponse;
	}

	const { client } = authResult;
	const deviceCodeHash = await hashToken(deviceCode);

	const result = await db
		.select()
		.from(oauthDeviceCodes)
		.where(eq(oauthDeviceCodes.deviceCodeHash, deviceCodeHash))
		.limit(1);

	const record = result[0];
	if (!record || record.clientId !== client.id) {
		return invalidGrant(c, "Invalid device_code.");
	}

	const now = Date.now();

	// Check if device code expired
	if (record.expiresAt <= now) {
		return c.json(
			{
				error: "expired_token",
				error_description: "The device authorization request has expired.",
			},
			400,
		);
	}

	// Rate limiting & Slow Down enforcement (RFC 8628 §3.5)
	if (
		record.lastPolledAt !== null &&
		now - record.lastPolledAt < record.pollingInterval * 1000 - 500
	) {
		const newInterval = record.pollingInterval + 5;
		await db
			.update(oauthDeviceCodes)
			.set({
				pollingInterval: newInterval,
				lastPolledAt: now,
			})
			.where(eq(oauthDeviceCodes.id, record.id));

		return c.json(
			{
				error: "slow_down",
				error_description: `Polling too rapidly. Increase polling interval to ${newInterval} seconds.`,
			},
			400,
		);
	}

	// Update last polled timestamp
	await db
		.update(oauthDeviceCodes)
		.set({
			lastPolledAt: now,
		})
		.where(eq(oauthDeviceCodes.id, record.id));

	// Check authorization status
	if (record.status === "pending") {
		return c.json(
			{
				error: "authorization_pending",
				error_description:
					"The authorization request is pending user approval.",
			},
			400,
		);
	}

	if (record.status === "denied") {
		return c.json(
			{
				error: "access_denied",
				error_description: "The user denied the authorization request.",
			},
			400,
		);
	}

	if (record.status !== "approved" || !record.userId) {
		return invalidGrant(c);
	}

	// Check sign-in mode
	const settings = await getOrCreateInstanceSettings(db);
	if (settings.signinMode === "disabled") {
		const isAdmin = await isUserAdmin(db, record.userId);
		if (!isAdmin) {
			return invalidGrant(
				c,
				"Authentication and token exchanges are disabled on this instance.",
			);
		}
	}

	// Consume device code record to prevent replay
	await db.delete(oauthDeviceCodes).where(eq(oauthDeviceCodes.id, record.id));

	// Issue tokens
	const accessToken = await createAccessToken(
		db,
		client.id,
		record.userId,
		record.scope,
	);

	const refreshToken = await createRefreshToken(
		db,
		client.id,
		record.userId,
		record.scope,
	);

	const grantedScopes = record.scope.split(" ").filter(Boolean);
	let idToken: string | undefined;

	if (grantedScopes.includes("openid")) {
		idToken = await createIdToken({
			privateKey: c.env.OIDC_PRIVATE_KEY,
			issuer: c.env.OIDC_ISSUER,
			clientId: client.id,
			userId: record.userId,
			expiresIn: ACCESS_TOKEN_DURATION / 1000,
		});
	}

	return c.json(
		{
			access_token: accessToken.token,
			token_type: "Bearer",
			expires_in: ACCESS_TOKEN_DURATION / 1000,
			refresh_token: refreshToken.token,
			...(idToken ? { id_token: idToken } : {}),
			scope: record.scope,
		},
		200,
	);
}
