import {
	verifyRegistrationResponse,
	type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { passkeys } from "@/db/schema";
import { getDashboardOrigin } from "@/lib/env";
import { emitNotification } from "@/lib/notifications/emitter";
import { arrayBufferToBase64, consumeChallenge } from "@/lib/passkey";
import { getSessionUser } from "@/lib/session";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";
import { RegisterPasskeyVerifyRequestSchema } from "@/schemas/passkeys";

export const verifyRegisterPasskeyRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["WebAuthn & Passkeys"],
	summary: "Verify passkey enrollment",
	description:
		"Validate WebAuthn attestation ceremony response and persist public key credential.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: RegisterPasskeyVerifyRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Passkey registered successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Verification failed or challenge expired",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Passkey already registered",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	verifyRegisterPasskeyRoute,
	async (c) => {
		const token = getCookie(c, "session");

		if (!token) {
			return c.json(
				{
					error: "Unauthorized",
				},
				401,
			);
		}

		const db = createDb(c.env.DB);
		const user = await getSessionUser(db, token);

		if (!user) {
			return c.json(
				{
					error: "Unauthorized",
				},
				401,
			);
		}

		const challenge = await consumeChallenge(db, user.id);

		if (!challenge) {
			return c.json(
				{
					error: "Registration challenge not found or expired.",
				},
				400,
			);
		}

		const body = c.req.valid("json");
		const name = body.name?.trim() || null;

		try {
			const expectedOrigin = getDashboardOrigin(c.env);
			const expectedRPID = c.env.RP_ID;

			const verification = await verifyRegistrationResponse({
				response: body.response as RegistrationResponseJSON,
				expectedChallenge: challenge.challenge,
				expectedOrigin,
				expectedRPID,
			});

			if (!verification.verified || !verification.registrationInfo) {
				return c.json(
					{
						error: "Passkey registration failed.",
					},
					400,
				);
			}

			const { credential, aaguid, credentialDeviceType, credentialBackedUp } =
				verification.registrationInfo;

			const existingCredential = await db
				.select({
					id: passkeys.id,
				})
				.from(passkeys)
				.where(eq(passkeys.credentialId, credential.id))
				.limit(1);

			if (existingCredential[0]) {
				return c.json(
					{
						error: "This passkey is already registered.",
					},
					409,
				);
			}

			const now = Date.now();

			await db.insert(passkeys).values({
				id: crypto.randomUUID(),
				userId: user.id,
				credentialId: credential.id,
				publicKey: arrayBufferToBase64(credential.publicKey),
				counter: credential.counter,
				aaguid: aaguid || null,
				backedUp: credentialBackedUp ?? null,
				deviceType: credentialDeviceType ?? null,
				transports: credential.transports
					? JSON.stringify(credential.transports)
					: null,
				name,
				createdAt: now,
				lastUsedAt: null,
			});

			await emitNotification(db, {
				userId: user.id,
				type: "security.passkey_added",
				category: "security",
				severity: "success",
				title: "Passkey Registered",
				message: `A new passkey (${name ?? "Unnamed"}) was added to your account.`,
				actionUrl: "/account/passkeys",
			});

			return c.json(
				{
					success: true,
				},
				200,
			);
		} catch (error) {
			console.error("[Passkey] Registration verification error:", error);

			return c.json(
				{
					error: "Unable to verify passkey registration.",
				},
				400,
			);
		}
	},
);

export default route;
