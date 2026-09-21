import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { listSigninKeys } from "@/lib/signinKeys";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { AdminSigninKeysListResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const getAdminSigninKeysRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Admin Sign-in Keys"],
	summary: "List admin sign-in keys",
	description: "Lists all configured administrator sign-in access keys.",
	middleware: [requirePermission("settings:read")] as const,
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdminSigninKeysListResponseSchema,
				},
			},
			description: "List of admin sign-in keys",
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

route.openapi(getAdminSigninKeysRoute, async (c) => {
	const db = createDb(c.env.DB);
	const keys = await listSigninKeys(db);

	return c.json(
		{
			keys,
		},
		200,
	);
});

export default route;
