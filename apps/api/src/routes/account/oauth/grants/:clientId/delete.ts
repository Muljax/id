import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { revokeOAuthAccess } from "@/lib/oauth/grant";
import { type AppEnv, requireSessionAuth } from "@/middleware/auth";
import { ClientIdParamSchema } from "@/schemas/account";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

export const revokeOAuthGrantRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Account & Profile"],
	summary: "Revoke application authorization",
	description:
		"Revoke access tokens, refresh tokens, and consent grant for a specific OAuth client.",
	request: {
		params: ClientIdParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Application authorization successfully revoked",
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
			description: "Client not found",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requireSessionAuth);

route.openapi(revokeOAuthGrantRoute, async (c) => {
	const user = c.get("user");
	const { clientId } = c.req.valid("param");

	const db = createDb(c.env.DB);

	await revokeOAuthAccess(db, user.id, clientId);

	await emitNotification(db, {
		userId: user.id,
		type: "security.oauth_grant_revoked",
		category: "security",
		severity: "warning",
		title: "Application Authorization Revoked",
		message: "You revoked third-party application access to your account.",
		actionUrl: "/account/authorized-apps",
	});

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
