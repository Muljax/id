import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { passkeys } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { ErrorResponseSchema } from "@/schemas/common";
import { PasskeysListResponseSchema } from "@/schemas/passkeys";

export const getPasskeysRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["WebAuthn & Passkeys"],
	summary: "List enrolled passkeys",
	description:
		"Retrieve all registered WebAuthn / FIDO2 passkeys for the caller.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: PasskeysListResponseSchema,
				},
			},
			description: "List of registered passkeys",
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
	getPasskeysRoute,
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

		const result = await db
			.select({
				id: passkeys.id,
				name: passkeys.name,
				aaguid: passkeys.aaguid,
				backedUp: passkeys.backedUp,
				deviceType: passkeys.deviceType,
				transports: passkeys.transports,
				createdAt: passkeys.createdAt,
				lastUsedAt: passkeys.lastUsedAt,
			})
			.from(passkeys)
			.where(eq(passkeys.userId, user.id));

		const formatted = result.map((pk) => ({
			id: pk.id,
			name: pk.name,
			aaguid: pk.aaguid,
			backedUp: pk.backedUp,
			deviceType: pk.deviceType,
			transports: pk.transports
				? (JSON.parse(pk.transports) as string[])
				: null,
			createdAt: pk.createdAt,
			lastUsedAt: pk.lastUsedAt,
		}));

		return c.json(
			{
				passkeys: formatted,
			},
			200,
		);
	},
);

export default route;
