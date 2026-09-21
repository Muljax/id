import {
	verifyAuthenticationResponse,
	type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { passkeys, users } from "@/db/schema";
import { setSessionCookie } from "@/lib/cookie";
import { getDashboardOrigin } from "@/lib/env";
import { base64ToUint8Array, consumeChallengeById } from "@/lib/passkey";
import { isUserAdmin } from "@/lib/rbac/permissions";
import { createSession } from "@/lib/session";
import { getOrCreateInstanceSettings } from "@/lib/settings";
import { verifySigninKey } from "@/lib/signinKeys";
import { isUserDisabled, toAuthUser } from "@/lib/user";
import { AuthUserResponseSchema } from "@/schemas/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import { LoginPasskeyVerifyRequestSchema } from "@/schemas/passkeys";

interface CloudflareRequestProperties {
	country?: string;
	city?: string;
	region?: string;
	latitude?: string | number;
	longitude?: string | number;
}

export const verifyLoginPasskeyRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["WebAuthn & Passkeys"],
	summary: "Authenticate with passkey",
	description:
		"Verify WebAuthn assertion signature and establish new user session.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: LoginPasskeyVerifyRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AuthUserResponseSchema,
				},
			},
			description: "Authentication successful",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid assertion or expired challenge",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid passkey credentials",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Sign-in disabled or admin key missing/invalid",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	verifyLoginPasskeyRoute,
	async (c) => {
		const body = c.req.valid("json");

		const db = createDb(c.env.DB);
		const settings = await getOrCreateInstanceSettings(db);

		if (settings.signinMode === "disabled") {
			return c.json(
				{
					error: "Authentication is currently disabled on this instance.",
				},
				403,
			);
		}

		const challenge = await consumeChallengeById(db, body.challengeId);

		if (!challenge) {
			return c.json(
				{
					error: "Authentication challenge not found or expired.",
				},
				400,
			);
		}

		const responsePayload = body.response as AuthenticationResponseJSON;

		const credentialResult = await db
			.select()
			.from(passkeys)
			.where(eq(passkeys.credentialId, responsePayload.id))
			.limit(1);

		const passkey = credentialResult[0];

		if (!passkey) {
			return c.json(
				{
					error: "Invalid passkey.",
				},
				401,
			);
		}

		const userResult = await db
			.select()
			.from(users)
			.where(eq(users.id, passkey.userId))
			.limit(1);

		const user = userResult[0];

		if (!user) {
			return c.json(
				{
					error: "Unable to sign in with passkey.",
				},
				401,
			);
		}

		if (isUserDisabled(user)) {
			return c.json(
				{
					error: "Your account has been disabled.",
				},
				403,
			);
		}

		if (settings.signinMode === "admin_key") {
			const isAdmin = await isUserAdmin(db, user.id);
			if (!isAdmin) {
				if (!body.adminKey) {
					return c.json(
						{
							error: "An administrator access key is required to sign in.",
						},
						403,
					);
				}

				const keyResult = await verifySigninKey(db, body.adminKey.trim());
				if (!keyResult.valid) {
					return c.json(
						{
							error:
								keyResult.error ||
								"Invalid or expired administrator access key.",
						},
						401,
					);
				}
			} else if (body.adminKey) {
				await verifySigninKey(db, body.adminKey.trim());
			}
		}

		try {
			const expectedOrigin = getDashboardOrigin(c.env);
			const expectedRPID = c.env.RP_ID;

			const verification = await verifyAuthenticationResponse({
				response: responsePayload,
				expectedChallenge: challenge.challenge,
				expectedOrigin,
				expectedRPID,
				credential: {
					id: passkey.credentialId,
					publicKey: base64ToUint8Array(passkey.publicKey),
					counter: passkey.counter,
					transports: passkey.transports
						? JSON.parse(passkey.transports)
						: undefined,
				},
			});

			if (!verification.verified) {
				return c.json(
					{
						error: "Passkey authentication failed.",
					},
					401,
				);
			}

			if (isUserDisabled(user)) {
				return c.json(
					{
						error: "Your account has been disabled.",
					},
					403,
				);
			}

			await db
				.update(passkeys)
				.set({
					counter: verification.authenticationInfo.newCounter,
					lastUsedAt: Date.now(),
				})
				.where(eq(passkeys.id, passkey.id));

			const cf = c.req.raw.cf as CloudflareRequestProperties | undefined;
			const rawLat = cf?.latitude ?? c.req.header("CF-IPLatitude");
			const rawLon = cf?.longitude ?? c.req.header("CF-IPLongitude");

			const session = await createSession(db, user.id, {
				ipAddress: c.req.header("CF-Connecting-IP"),
				country: cf?.country,
				city: cf?.city,
				region: cf?.region,
				latitude: rawLat != null && rawLat !== "" ? Number(rawLat) : undefined,
				longitude: rawLon != null && rawLon !== "" ? Number(rawLon) : undefined,
				userAgent: c.req.header("User-Agent"),
			});

			setSessionCookie(c, session.token);

			return c.json(
				{
					user: await toAuthUser(db, user),
				},
				200,
			);
		} catch (error) {
			console.error("[Passkey] Authentication verification error:", error);

			return c.json(
				{
					error: "Unable to verify passkey authentication.",
				},
				400,
			);
		}
	},
);

export default route;
