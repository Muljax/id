import { and, eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { passkeys } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { type AppEnv, requireStrictSessionAuth } from "@/middleware/auth";
import {
	ErrorResponseSchema,
	IdParamSchema,
	SuccessResponseSchema,
} from "@/schemas/common";

export const deletePasskeyRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["WebAuthn & Passkeys"],
	summary: "Delete passkey",
	description: "Permanently delete an enrolled passkey credential.",
	request: {
		params: IdParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Passkey deleted",
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

route.openapi(deletePasskeyRoute, async (c) => {
	const user = c.get("user");
	const { id: passkeyId } = c.req.valid("param");

	const db = createDb(c.env.DB);

	const result = await db
		.delete(passkeys)
		.where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, user.id)))
		.returning({ id: passkeys.id, name: passkeys.name });

	if (result.length === 0) {
		return c.json(
			{
				error: "Passkey not found.",
			},
			404,
		);
	}

	await emitNotification(db, {
		userId: user.id,
		type: "security.passkey_removed",
		category: "security",
		severity: "warning",
		title: "Passkey Removed",
		message: `The passkey (${result[0].name ?? "Unnamed"}) was removed from your account.`,
		actionUrl: "/account/passkeys",
	});

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
