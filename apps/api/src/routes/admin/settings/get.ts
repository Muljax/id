import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { getOrCreateInstanceSettings } from "@/lib/settings";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { AdminSettingsResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const getAdminSettingsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Admin Settings"],
	summary: "Get instance settings",
	description:
		"Retrieves current tenant configuration and authentication policies.",
	middleware: [requirePermission("settings:read")] as const,
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdminSettingsResponseSchema,
				},
			},
			description: "Current instance settings",
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

route.openapi(getAdminSettingsRoute, async (c) => {
	const db = createDb(c.env.DB);
	const settings = await getOrCreateInstanceSettings(db);

	return c.json(
		{
			settings,
		},
		200,
	);
});

export default route;
