import { and, eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { passkeys } from "@/db/schema";
import { type AppEnv, requireStrictSessionAuth } from "@/middleware/auth";
import {
	ErrorResponseSchema,
	IdParamSchema,
	SuccessResponseSchema,
} from "@/schemas/common";
import { UpdatePasskeyRequestSchema } from "@/schemas/passkeys";

export const updatePasskeyRoute = createRoute({
	method: "patch",
	path: "/",
	tags: ["WebAuthn & Passkeys"],
	summary: "Rename passkey",
	description: "Update the friendly display name of an enrolled passkey.",
	request: {
		params: IdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: UpdatePasskeyRequestSchema,
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
			description: "Passkey name updated",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid name",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Passkey not found",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requireStrictSessionAuth);

route.openapi(updatePasskeyRoute, async (c) => {
	const user = c.get("user");
	const { id: passkeyId } = c.req.valid("param");
	const { name } = c.req.valid("json");

	const db = createDb(c.env.DB);

	const result = await db
		.update(passkeys)
		.set({
			name: name.trim(),
		})
		.where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, user.id)))
		.returning({
			id: passkeys.id,
		});

	if (result.length === 0) {
		return c.json(
			{
				error: "Passkey not found.",
			},
			404,
		);
	}

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
