import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { verifyPasswordResetToken } from "@/lib/password-reset";
import {
	PasswordResetVerifyQuerySchema,
	PasswordResetVerifyResponseSchema,
} from "@/schemas/auth";
import { ErrorResponseSchema } from "@/schemas/common";

export const verifyPasswordResetRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Authentication"],
	summary: "Verify password reset token",
	description:
		"Validate a password reset token before displaying the reset form.",
	request: {
		query: PasswordResetVerifyQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: PasswordResetVerifyResponseSchema,
				},
			},
			description: "Token is valid",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid or expired token",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	verifyPasswordResetRoute,
	async (c) => {
		const { token } = c.req.valid("query");

		const db = createDb(c.env.DB);
		const record = await verifyPasswordResetToken(db, token);

		if (!record) {
			return c.json(
				{
					error: "Invalid or expired password reset token",
				},
				400,
			);
		}

		return c.json(
			{
				valid: true,
				email: record.userEmail,
				expiresAt: record.expiresAt,
			},
			200,
		);
	},
);

export default route;
