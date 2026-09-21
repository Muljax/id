import {
	verifyAuthenticationResponse,
	type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { and, eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { passkeys } from "@/db/schema";
import { getDashboardOrigin } from "@/lib/env";
import {
	base64ToUint8Array,
	consumeChallenge,
	consumeChallengeForUser,
} from "@/lib/passkey";
import { verifyPassword } from "@/lib/password";
import { elevateSession, getSessionUserWithSession } from "@/lib/session";
import { isUserDisabled } from "@/lib/user";
import { ElevateRequestSchema, ElevateResponseSchema } from "@/schemas/auth";
import { ErrorResponseSchema } from "@/schemas/common";

export const verifyElevateRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Session & Authentication"],
	summary: "Elevate current session privilege",
	description:
		"Verify passkey biometric assertion or account password to temporarily elevate active session.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: ElevateRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ElevateResponseSchema,
				},
			},
			description: "Session successfully elevated",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid request, missing assertion, or expired challenge",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Authentication verification failed",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Account disabled",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	verifyElevateRoute,
	async (c) => {
		const token = getCookie(c, "session");
		if (!token) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const db = createDb(c.env.DB);
		const record = await getSessionUserWithSession(db, token);

		if (!record) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const { user, session } = record;

		if (isUserDisabled(user)) {
			return c.json({ error: "Your account has been disabled." }, 403);
		}

		const body = c.req.valid("json");

		if (body.password) {
			if (!user.passwordHash) {
				return c.json(
					{ error: "This account does not have a password configured." },
					400,
				);
			}

			const valid = await verifyPassword(body.password, user.passwordHash);
			if (!valid) {
				return c.json({ error: "Invalid password." }, 401);
			}
		} else if (body.response) {
			const challenge = body.challengeId
				? await consumeChallengeForUser(db, body.challengeId, user.id)
				: await consumeChallenge(db, user.id);

			if (!challenge) {
				return c.json(
					{ error: "Authentication challenge not found or expired." },
					400,
				);
			}

			const responsePayload =
				body.response as unknown as AuthenticationResponseJSON;
			const credentialResult = await db
				.select()
				.from(passkeys)
				.where(
					and(
						eq(passkeys.credentialId, responsePayload.id),
						eq(passkeys.userId, user.id),
					),
				)
				.limit(1);

			const passkey = credentialResult[0];
			if (!passkey) {
				return c.json(
					{ error: "Passkey not registered to this account." },
					401,
				);
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
					return c.json({ error: "Passkey verification failed." }, 401);
				}

				await db
					.update(passkeys)
					.set({
						counter: verification.authenticationInfo.newCounter,
						lastUsedAt: Date.now(),
					})
					.where(eq(passkeys.id, passkey.id));
			} catch (err) {
				console.error("[Elevate] Passkey verification failed:", err);
				return c.json(
					{ error: "Unable to verify passkey authentication." },
					400,
				);
			}
		} else {
			return c.json(
				{ error: "Passkey response or password is required." },
				400,
			);
		}

		const elevatedUntil = await elevateSession(db, session.id);

		return c.json(
			{
				success: true,
				elevatedUntil,
			},
			200,
		);
	},
);

export default route;
