import {
	verifyAuthenticationResponse,
	type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

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

interface CloudflareRequestProperties {
	country?: string;
	city?: string;
	region?: string;
}

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
	const body = await c.req.json<{
		challengeId?: string;
		adminKey?: string;
		response: AuthenticationResponseJSON;
	}>();

	if (!body.challengeId) {
		return c.json(
			{
				error: "Authentication challenge is required.",
			},
			400,
		);
	}

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

	const credentialResult = await db
		.select()
		.from(passkeys)
		.where(eq(passkeys.credentialId, body.response.id))
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

			const keyResult = await verifySigninKey(db, body.adminKey);
			if (!keyResult.valid) {
				return c.json(
					{
						error:
							keyResult.error || "Invalid or expired administrator access key.",
					},
					401,
				);
			}
		} else if (body.adminKey) {
			await verifySigninKey(db, body.adminKey);
		}
	}

	try {
		const expectedOrigin = getDashboardOrigin(c.env);

		const expectedRPID = c.env.RP_ID;

		const verification = await verifyAuthenticationResponse({
			response: body.response,
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

		const session = await createSession(db, user.id, {
			ipAddress: c.req.header("CF-Connecting-IP"),
			country: cf?.country,
			city: cf?.city,
			region: cf?.region,
			userAgent: c.req.header("User-Agent"),
		});

		setSessionCookie(c, session.token);

		return c.json({
			user: await toAuthUser(db, user),
		});
	} catch (error) {
		console.error("[Passkey] Authentication verification error:", error);

		return c.json(
			{
				error: "Unable to verify passkey authentication.",
			},
			400,
		);
	}
});

export default route;
