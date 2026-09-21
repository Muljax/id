import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { createChallenge } from "@/lib/passkey";

export const getLoginPasskeyOptionsRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["WebAuthn & Passkeys"],
	summary: "Generate passkey authentication options",
	description:
		"Initiate passkey authentication ceremony and return challenge + options.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.any().openapi({
						description:
							"WebAuthn PublicKeyCredentialRequestOptions JSON + challengeId",
					}),
				},
			},
			description: "Authentication options generated",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	getLoginPasskeyOptionsRoute,
	async (c) => {
		const db = createDb(c.env.DB);

		const options = await generateAuthenticationOptions({
			rpID: c.env.RP_ID,
			userVerification: "preferred",
		});

		const challenge = await createChallenge(db, null, options.challenge);

		return c.json(
			{
				...options,
				challengeId: challenge.id,
			},
			200,
		);
	},
);

export default route;
