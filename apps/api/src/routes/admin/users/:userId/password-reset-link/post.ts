import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { getDashboardOrigin } from "@/lib/env";
import { emitNotification } from "@/lib/notifications/emitter";
import { createPasswordResetToken } from "@/lib/password-reset";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { PasswordResetLinkResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const createPasswordResetLinkRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Admin Users"],
	summary: "Generate password reset link",
	description:
		"Generates an out-of-band one-time password reset link for a specific user account.",
	middleware: [requirePermission("users:password-reset")] as const,
	request: {
		params: z.object({
			userId: z.string().openapi({
				param: {
					name: "userId",
					in: "path",
				},
				example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
				description: "Target user ID",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: PasswordResetLinkResponseSchema,
				},
			},
			description: "Password reset link generated successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing user ID",
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
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "User not found",
		},
	},
});

route.openapi(createPasswordResetLinkRoute, async (c) => {
	const { userId } = c.req.valid("param");

	const db = createDb(c.env.DB);

	const targetUsers = await db
		.select({
			id: users.id,
			email: users.email,
			displayName: users.displayName,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	const targetUser = targetUsers[0];

	if (!targetUser) {
		return c.json(
			{
				error: "User not found.",
			},
			404,
		);
	}

	const { token, expiresAt } = await createPasswordResetToken(db, userId);
	const origin = getDashboardOrigin(c.env);
	const resetUrl = `${origin}/reset-password?token=${token}`;

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.password_reset_link_generated",
		category: "security",
		severity: "info",
		title: "Password Reset Link Generated",
		message: `Admin ${adminUser.email} generated a password reset link for user ${targetUser.email}.`,
		actionUrl: `/admin/users?userId=${targetUser.id}`,
		data: {
			adminUserId: adminUser.id,
			targetUserId: targetUser.id,
			expiresAt,
		},
	});

	return c.json(
		{
			token,
			resetUrl,
			expiresAt,
		},
		200,
	);
});

export default route;
