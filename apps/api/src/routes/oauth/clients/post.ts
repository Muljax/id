import { Hono } from "hono";

import { createDb } from "@/db";
import {
	createOAuthClient,
	isOAuthClientType,
	isValidScopeString,
} from "@/lib/oauth/client";
import { emitNotification } from "@/lib/notifications/emitter";
import { hashToken } from "@/lib/token";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post("/", requirePermission("oauth_clients:write"), async (c) => {
	const body = await c.req.json<{
		name: string;
		clientType: string;
		redirectUris: string[];
		scopes: string[];
	}>();

	if (
		!body.name ||
		!isOAuthClientType(body.clientType) ||
		!Array.isArray(body.redirectUris) ||
		!Array.isArray(body.scopes) ||
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

	if (client) {
		await emitNotification(db, {
			target: "admins",
			type: "admin.client_created",
			category: "admin",
			severity: "success",
			title: "OAuth Client Created",
			message: `OAuth client "${client.name}" (${client.id}) was created.`,
			actionUrl: "/admin/clients",
		});
	}

	return c.json(
		{
			client_id: client?.id,
			client_secret: clientSecret,
			name: client?.name,
			client_type: client?.clientType,
			redirect_uris: client?.redirectUris,
			scopes: client?.scopes,
		},
		201,
	);
});

export default route;
