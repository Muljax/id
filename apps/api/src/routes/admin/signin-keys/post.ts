import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { createSigninKey } from "@/lib/signinKeys";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import {
	AdminSigninKeyCreatedResponseSchema,
	CreateSigninKeyRequestSchema,
} from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const createAdminSigninKeyRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Admin Sign-in Keys"],
	summary: "Create admin sign-in key",
	description:
		"Generates a new administrator pre-shared sign-in key for restricted signin modes.",
	middleware: [requirePermission("settings:write")] as const,
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateSigninKeyRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: AdminSigninKeyCreatedResponseSchema,
				},
			},
			description: "Sign-in key created successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing or invalid key name",
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

route.openapi(createAdminSigninKeyRoute, async (c) => {
	const body = c.req.valid("json");
	const name = body.name.trim();
	const ttlHours = body.ttlHours;

	const db = createDb(c.env.DB);
	const currentUser = c.get("user");

	const signinKey = await createSigninKey(db, {
		name,
		createdByUserId: currentUser?.id,
		ttlHours,
	});

	await emitNotification(db, {
		target: "admins",
		type: "admin.signin_key_created",
		category: "admin",
		severity: "warning",
		title: "Admin Sign-in Key Created",
		message: `Admin ${currentUser?.email} generated new access key "${name}".`,
		actionUrl: "/admin/settings",
	});

	return c.json(
		{
			key: signinKey,
		},
		201,
	);
});

export default route;
