import { Hono } from "hono";

import { createDb } from "@/db";
import {
	getOAuthClient,
	OIDC_SCOPES,
	updateOAuthClient,
} from "@/lib/oauth/client";
import { emitNotification } from "@/lib/notifications/emitter";
import { requireAdmin } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.patch("/", requireAdmin, async (c) => {
	const body = await c.req.json<{
		name: string;
		redirectUris: string[];
		scopes: string[];
	}>();

	if (
		!body.name ||
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

	const clientId = c.req.param("id");

	if (!clientId) {
		return c.json(
			{
				error: "client_not_found",
			},
			404,
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

	if (client) {
		await emitNotification(db, {
			target: "admins",
			type: "admin.client_updated",
			category: "admin",
			severity: "info",
			title: "OAuth Client Updated",
			message: `OAuth client "${client.name}" (${client.id}) was updated.`,
			actionUrl: "/admin/clients",
		});
	}

	return c.json({
		client_id: client?.id,
		name: client?.name,
		client_type: client?.clientType,
		redirect_uris: client?.redirectUris,
		scopes: client?.scopes,
		created_at: client?.createdAt,
		updated_at: client?.updatedAt,
	});
});

export default route;
