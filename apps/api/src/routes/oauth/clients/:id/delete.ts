import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { deleteOAuthClient } from "@/lib/oauth/client";
import {
	type AppEnv,
	requireElevatedSession,
	requirePermission,
} from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const deleteOAuthClientRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["OAuth Clients"],
	summary: "Delete OAuth client",
	description: "Permanently deletes a registered OAuth application.",
	middleware: [
		requirePermission("oauth_clients:write"),
		requireElevatedSession,
	] as const,
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "client_123456",
				description: "OAuth Client ID",
			}),
		}),
	},
	responses: {
		204: {
			description: "OAuth client deleted successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing client ID",
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
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Client not found",
		},
	},
});

route.openapi(deleteOAuthClientRoute, async (c) => {
	const { id: clientId } = c.req.valid("param");

	const db = createDb(c.env.DB);
	const client = await deleteOAuthClient(db, clientId);

	if (!client) {
		return c.json(
			{
				error: "client_not_found",
			},
			404,
		);
	}

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.client_deleted",
		category: "admin",
		severity: "warning",
		title: "OAuth Client Deleted",
		message: `Admin ${adminUser?.email ?? "unknown"} deleted OAuth client "${client.name}" (${client.id}).`,
		actionUrl: "/admin/clients",
	});

	return c.body(null, 204);
});

export default route;
