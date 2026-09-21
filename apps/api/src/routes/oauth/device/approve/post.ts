import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { approveDeviceCode } from "@/lib/oauth/device";
import { isUserAdmin } from "@/lib/rbac/permissions";
import { getOrCreateInstanceSettings } from "@/lib/settings";
import { type AppEnv, requireStrictSessionAuth } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import {
	OAuthDeviceApproveRequestSchema,
	OAuthDeviceApproveResponseSchema,
} from "@/schemas/oauth";

const route = new OpenAPIHono<AppEnv>();

export const oauthDeviceApproveRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["OAuth"],
	summary: "Approve device authorization request",
	description:
		"Authorizes a pending device authorization request for the current authenticated user session.",
	middleware: [requireStrictSessionAuth] as const,
	request: {
		body: {
			content: {
				"application/json": {
					schema: OAuthDeviceApproveRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthDeviceApproveResponseSchema,
				},
			},
			description: "Device authorization approved successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Device code invalid, expired, or already processed",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Login required",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Access denied or maintenance mode active",
		},
	},
});

route.openapi(oauthDeviceApproveRoute, async (c) => {
	const { user_code: userCode } = c.req.valid("json");
	const user = c.get("user");
	const db = createDb(c.env.DB);
	const settings = await getOrCreateInstanceSettings(db);

	if (settings.signinMode === "disabled") {
		return c.json(
			{
				error: "temporarily_unavailable",
				error_description:
					"Authentication and device authorizations are currently disabled on this instance.",
			},
			403,
		);
	}

	if (settings.signinMode === "admin_key") {
		const isAdmin = await isUserAdmin(db, user.id);
		if (!isAdmin) {
			return c.json(
				{
					error: "access_denied",
					error_description:
						"Maintenance mode active: Approving authorizations requires administrator privileges.",
				},
				403,
			);
		}
	}

	const success = await approveDeviceCode(db, userCode, user.id);
	if (!success) {
		return c.json(
			{
				error: "invalid_request",
				error_description:
					"The device authorization request has expired or is no longer pending.",
			},
			400,
		);
	}

	await emitNotification(db, {
		target: "user",
		userId: user.id,
		type: "auth.device_approved",
		category: "security",
		severity: "info",
		title: "Device Connected",
		message: "A new device was successfully authorized using a device code.",
		actionUrl: "/account/sessions",
	});

	return c.json(
		{
			success: true,
			status: "approved" as const,
		},
		200,
	);
});

export default route;
