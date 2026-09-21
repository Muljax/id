import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { listInviteTokens } from "@/lib/invites";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { AdminInvitesListResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const getAdminInvitesRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Admin Invites"],
	summary: "List all user invitations",
	description: "Lists all pending and used registration invitation tokens.",
	middleware: [requirePermission("users:read")] as const,
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdminInvitesListResponseSchema,
				},
			},
			description: "List of invitations",
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

route.openapi(getAdminInvitesRoute, async (c) => {
	const db = createDb(c.env.DB);
	const invites = await listInviteTokens(db);

	return c.json(
		{
			invites,
		},
		200,
	);
});

export default route;
