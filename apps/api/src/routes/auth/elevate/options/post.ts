import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { passkeys } from "@/db/schema";
import { createChallenge } from "@/lib/passkey";
import { getSessionUser } from "@/lib/session";
import { isUserDisabled } from "@/lib/user";
import { ElevateOptionsResponseSchema } from "@/schemas/auth";
import { ErrorResponseSchema } from "@/schemas/common";

export const getElevateOptionsRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Session & Authentication"],
	summary: "Generate step-up re-authentication options",
	description:
		"Generate challenge and options to elevate active session via passkey or password.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ElevateOptionsResponseSchema,
				},
			},
			description: "Elevation options generated",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
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
	getElevateOptionsRoute,
	async (c) => {
		const token = getCookie(c, "session");
		if (!token) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const db = createDb(c.env.DB);
		const user = await getSessionUser(db, token);

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		if (isUserDisabled(user)) {
			return c.json({ error: "Your account has been disabled." }, 403);
		}

		const userPasskeys = await db
			.select({
				credentialId: passkeys.credentialId,
				transports: passkeys.transports,
			})
			.from(passkeys)
			.where(eq(passkeys.userId, user.id));

		const allowCredentials = userPasskeys.map((pk) => ({
			id: pk.credentialId,
			transports: pk.transports
				? (JSON.parse(pk.transports) as never)
				: undefined,
		}));

		const options = await generateAuthenticationOptions({
			rpID: c.env.RP_ID,
			userVerification: "preferred",
			allowCredentials:
				allowCredentials.length > 0 ? allowCredentials : undefined,
		});

		const challenge = await createChallenge(db, user.id, options.challenge);

		return c.json(
			{
				challengeId: challenge.id,
				challenge: options.challenge,
				rpId: options.rpId,
				timeout: options.timeout,
				userVerification: options.userVerification,
				allowCredentials:
					allowCredentials.length > 0 ? allowCredentials : undefined,
				hasPasskeys: userPasskeys.length > 0,
				hasPassword: Boolean(user.passwordHash),
			},
			200,
		);
	},
);

export default route;
