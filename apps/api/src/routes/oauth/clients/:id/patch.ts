import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import {
	getOAuthClient,
	isValidScopeString,
	updateOAuthClient,
} from "@/lib/oauth/client";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import {
	UpdateOAuthClientRequestSchema,
	UpdateOAuthClientResponseSchema,
} from "@/schemas/oauth";

const route = new OpenAPIHono<AppEnv>();

export const patchOAuthClientRoute = createRoute({
	method: "patch",
	path: "/",
	tags: ["OAuth Clients"],
	summary: "Update OAuth client application",
	description:
		"Updates an existing OAuth client's name, redirect URIs, or allowed scopes.",
	middleware: [requirePermission("oauth_clients:write")] as const,
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
		body: {
			content: {
				"application/json": {
					schema: UpdateOAuthClientRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UpdateOAuthClientResponseSchema,
				},
			},
			description: "OAuth client updated successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid update payload",
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
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Failed to update client",
		},
	},
});

route.openapi(patchOAuthClientRoute, async (c) => {
	const { id: clientId } = c.req.valid("param");
	const body = c.req.valid("json");

	if (
		body.scopes.length === 0 ||
		body.scopes.some((scope) => !isValidScopeString(scope))
	) {
		return c.json(
			{
				error: "invalid_request",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);
	const existing = await getOAuthClient(db, clientId);

	if (!existing) {
		return c.json(
			{
				error: "client_not_found",
			},
			404,
		);
	}

	const client = await updateOAuthClient(db, existing.id, {
		name: body.name.trim(),
		redirectUris: body.redirectUris,
		scopes: body.scopes,
	});

	if (!client) {
		return c.json(
			{
				error: "failed_to_update_client",
			},
			500,
		);
	}

	await emitNotification(db, {
		target: "admins",
		type: "admin.client_updated",
		category: "admin",
		severity: "info",
		title: "OAuth Client Updated",
		message: `OAuth client "${client.name}" (${client.id}) was updated.`,
		actionUrl: "/admin/clients",
	});

	return c.json(
		{
			client_id: client.id,
			name: client.name,
			client_type: client.clientType,
			redirect_uris: client.redirectUris,
			scopes: client.scopes,
			created_at: client.createdAt,
			updated_at: client.updatedAt,
		},
		200,
	);
});

export default route;
