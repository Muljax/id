import { generateRegistrationOptions } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { passkeys } from "@/db/schema";
import { createChallenge } from "@/lib/passkey";
import { getSessionUser } from "@/lib/session";
import { ErrorResponseSchema } from "@/schemas/common";

export const getRegisterOptionsRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["WebAuthn & Passkeys"],
	summary: "Generate passkey registration options",
	description:
		"Initiate FIDO2/WebAuthn enrollment ceremony and generate cryptographic challenge.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.any().openapi({
						description: "WebAuthn PublicKeyCredentialCreationOptions JSON",
					}),
				},
			},
			description: "Registration options generated",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	getRegisterOptionsRoute,
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

		const existingPasskeys = await db
			.select({
				credentialId: passkeys.credentialId,
			})
			.from(passkeys)
			.where(eq(passkeys.userId, user.id));

		const options = await generateRegistrationOptions({
			rpName: c.env.RP_NAME,
			rpID: c.env.RP_ID,
			userName: user.email,
			userDisplayName: user.email,
			excludeCredentials: existingPasskeys.map(({ credentialId }) => ({
				id: credentialId,
			})),
			authenticatorSelection: {
				residentKey: "required",
				userVerification: "preferred",
			},
			attestationType: "none",
		});

		await createChallenge(db, user.id, options.challenge);

		return c.json(options, 200);
	},
);

export default route;
