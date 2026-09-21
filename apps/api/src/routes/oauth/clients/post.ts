import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { createOAuthClient, isValidScopeString } from "@/lib/oauth/client";
import { hashToken } from "@/lib/token";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import {
	CreateOAuthClientRequestSchema,
	CreateOAuthClientResponseSchema,
} from "@/schemas/oauth";

const route = new OpenAPIHono<AppEnv>();

export const createOAuthClientRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["OAuth Clients"],
	summary: "Create OAuth client application",
	description:
		"Registers a new OAuth client. If confidential, generates and returns a client secret.",
	middleware: [requirePermission("oauth_clients:write")] as const,
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateOAuthClientRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: CreateOAuthClientResponseSchema,
				},
			},
			description: "OAuth client created successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid client registration payload",
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
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Failed to create client",
		},
	},
});

route.openapi(createOAuthClientRoute, async (c) => {
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

	if (body.clientType === "public") {
		if (body.redirectUris.length === 0) {
			return c.json(
				{
					error: "redirect_uri_required",
				},
				400,
			);
		}

		if (!body.scopes.includes("openid")) {
			return c.json(
				{
					error: "openid_required",
				},
				400,
			);
		}
	}

	let clientSecret: string | undefined;
	let clientSecretHash: string | undefined;

	if (body.clientType === "confidential") {
		clientSecret = crypto.randomUUID();
		clientSecretHash = await hashToken(clientSecret);
	}

	const db = createDb(c.env.DB);

	const client = await createOAuthClient(db, {
		name: body.name,
		clientType: body.clientType,
		clientSecretHash,
		redirectUris: body.redirectUris,
		scopes: body.scopes,
	});

	if (!client) {
		return c.json({ error: "Failed to create OAuth client." }, 500);
	}

	await emitNotification(db, {
		target: "admins",
		type: "admin.client_created",
		category: "admin",
		severity: "success",
		title: "OAuth Client Created",
		message: `OAuth client "${client.name}" (${client.id}) was created.`,
		actionUrl: "/admin/clients",
	});

	return c.json(
		{
			client_id: client.id,
			client_secret: clientSecret,
			name: client.name,
			client_type: client.clientType,
			redirect_uris: client.redirectUris,
			scopes: client.scopes,
		},
		201,
	);
});

export default route;
