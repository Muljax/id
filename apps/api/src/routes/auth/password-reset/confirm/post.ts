import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { PasswordResetConfirmRequestSchema } from "@/schemas/auth";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

export const confirmPasswordResetRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Authentication"],
	summary: "Confirm password reset",
	description: "Consume password reset token and update account password.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: PasswordResetConfirmRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Password successfully updated",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid or expired token, or invalid password",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	confirmPasswordResetRoute,
	async (c) => {
		const { token, newPassword } = c.req.valid("json");

		const db = createDb(c.env.DB);

		try {
			await consumePasswordResetToken(db, token.trim(), newPassword);

			return c.json(
				{
					success: true,
					message: "Password successfully updated. You may now log in.",
				},
				200,
			);
		} catch {
			return c.json(
				{
					error: "Invalid or expired password reset token",
				},
				400,
			);
		}
	},
);

export default route;
