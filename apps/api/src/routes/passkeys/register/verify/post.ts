import {
	verifyRegistrationResponse,
	type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { passkeys } from "@/db/schema";
import { getDashboardOrigin } from "@/lib/env";
import { arrayBufferToBase64, consumeChallenge } from "@/lib/passkey";
import { getSessionUser } from "@/lib/session";

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
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

	const body = await c.req.json<{
		response: RegistrationResponseJSON;
		name?: string;
	}>();

	const name = body.name?.trim() || null;

	try {
		const expectedOrigin = getDashboardOrigin(c.env);

		const expectedRPID = c.env.RP_ID;

		const verification = await verifyRegistrationResponse({
			response: body.response,
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

		const { credential } = verification.registrationInfo;

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
			transports: credential.transports
				? JSON.stringify(credential.transports)
				: null,
			name,
			createdAt: now,
			lastUsedAt: null,
		});

		return c.json({
			success: true,
		});
	} catch (error) {
		console.error("[Passkey] Registration verification error:", error);

		return c.json(
			{
				error: "Unable to verify passkey registration.",
			},
			400,
		);
	}
});

export default route;
