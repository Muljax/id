import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { denyDeviceCode } from "@/lib/oauth/device";
import { type AppEnv, requireStrictSessionAuth } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import {
	OAuthDeviceApproveRequestSchema,
	OAuthDeviceApproveResponseSchema,
} from "@/schemas/oauth";

const route = new OpenAPIHono<AppEnv>();

export const oauthDeviceDenyRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["OAuth"],
	summary: "Deny device authorization request",
	description: "Explicitly denies a pending device authorization request.",
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
			description: "Device authorization denied successfully",
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
			description: "Access denied",
		},
	},
});

route.openapi(oauthDeviceDenyRoute, async (c) => {
	const { user_code: userCode } = c.req.valid("json");
	const db = createDb(c.env.DB);

	const success = await denyDeviceCode(db, userCode);
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

	return c.json(
		{
			success: true,
			status: "denied" as const,
		},
		200,
	);
});

export default route;
