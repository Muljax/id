import { Hono } from "hono";

import { createDb } from "@/db";
import {
	createOAuthClient,
	isOAuthClientType,
	OIDC_SCOPES,
} from "@/lib/oauth/client";
import { emitNotification } from "@/lib/notifications/emitter";
import { hashToken } from "@/lib/token";
import { requireAdmin } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.post("/", requireAdmin, async (c) => {
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
		!Array.isArray(body.scopes)
	) {
		return c.json(
			{
				error: "invalid_request",
			},
			400,
		);
	}

	if (
		body.scopes.some(
			(scope) => !OIDC_SCOPES.includes(scope as (typeof OIDC_SCOPES)[number]),
		)
	) {
		return c.json(
			{
				error: "invalid_scope",
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
