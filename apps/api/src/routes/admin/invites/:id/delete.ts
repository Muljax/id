import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { revokeInviteToken } from "@/lib/invites";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const deleteAdminInviteRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Admin Invites"],
	summary: "Revoke an invitation token",
	description: "Revokes and deletes an outstanding user invitation token.",
	middleware: [requirePermission("users:write")] as const,
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "inv_123456",
				description: "Invite token ID",
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
			description: "Invitation revoked successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing invite ID",
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

route.openapi(deleteAdminInviteRoute, async (c) => {
	const { id } = c.req.valid("param");

	const db = createDb(c.env.DB);
	await revokeInviteToken(db, id);

	return c.json({ success: true }, 200);
});

export default route;
