import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import type { SigninMode, SignupMode } from "@/db/schema/instanceSettings";
import { emitNotification } from "@/lib/notifications/emitter";
import { updateInstanceSettings } from "@/lib/settings";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import {
	AdminSettingsPatchRequestSchema,
	AdminSettingsResponseSchema,
} from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const patchAdminSettingsRoute = createRoute({
	method: "patch",
	path: "/",
	tags: ["Admin Settings"],
	summary: "Update instance settings",
	description: "Updates tenant registration and sign-in mode policies.",
	middleware: [requirePermission("settings:write")] as const,
	request: {
		body: {
			content: {
				"application/json": {
					schema: AdminSettingsPatchRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdminSettingsResponseSchema,
				},
			},
			description: "Instance settings updated successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Invalid settings payload",
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

route.openapi(patchAdminSettingsRoute, async (c) => {
	const body = c.req.valid("json");

	const db = createDb(c.env.DB);
	const updated = await updateInstanceSettings(db, {
		signupMode: body.signupMode as SignupMode | undefined,
		signinMode: body.signinMode as SigninMode | undefined,
	});

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.settings_updated",
		category: "admin",
		severity: "info",
		title: "Instance Settings Updated",
		message: `Admin ${adminUser.email} updated tenant configuration.`,
		actionUrl: "/admin/settings",
	});

	return c.json(
		{
			settings: updated,
		},
		200,
	);
});

export default route;
