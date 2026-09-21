import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { revokeSigninKey } from "@/lib/signinKeys";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const deleteAdminSigninKeyRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Admin Sign-in Keys"],
	summary: "Revoke admin sign-in key",
	description: "Revokes and deletes an existing administrator sign-in key.",
	middleware: [requirePermission("settings:write")] as const,
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "key_12345",
				description: "Sign-in key ID",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Sign-in key revoked successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing key ID",
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
			description: "Forbidden - Insufficient permissions",
		},
	},
});

route.openapi(deleteAdminSigninKeyRoute, async (c) => {
	const { id } = c.req.valid("param");

	const db = createDb(c.env.DB);
	await revokeSigninKey(db, id);

	return c.json({ success: true }, 200);
});

export default route;
