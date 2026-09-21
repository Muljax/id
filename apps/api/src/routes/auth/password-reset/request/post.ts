import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { requestPasswordResetNotification } from "@/lib/password-reset";
import { PasswordResetRequestSchema } from "@/schemas/auth";
import { ErrorResponseSchema } from "@/schemas/common";

const PasswordResetMessageResponseSchema = z
	.object({
		message: z.string().openapi({
			example:
				"If an active account matches that email address, a password reset request has been submitted to your instance administrators.",
		}),
	})
	.openapi("PasswordResetMessageResponse");

export const requestPasswordResetRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Authentication"],
	summary: "Request password reset",
	description:
		"Submit password reset request for administrative recovery link generation.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: PasswordResetRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: PasswordResetMessageResponseSchema,
				},
			},
			description: "Reset request acknowledged",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid email",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	requestPasswordResetRoute,
	async (c) => {
		const { email } = c.req.valid("json");

		const db = createDb(c.env.DB);
		const ipAddress = c.req.header("CF-Connecting-IP") || undefined;
		const userAgent = c.req.header("User-Agent") || undefined;

		await requestPasswordResetNotification(db, email.trim(), {
			ipAddress,
			userAgent,
		});

		// Always return a generic 200 response to prevent user enumeration
		return c.json(
			{
				message:
					"If an active account matches that email address, a password reset request has been submitted to your instance administrators.",
			},
			200,
		);
	},
);

export default route;
