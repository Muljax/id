import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { hashPassword, verifyPassword } from "@/lib/password";
import { deleteOtherSessions } from "@/lib/session";
import { type AppEnv, requireStrictSessionAuth } from "@/middleware/auth";
import { ChangePasswordRequestSchema } from "@/schemas/account";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

export const changePasswordRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Account & Profile"],
	summary: "Change account password",
	description:
		"Verify current password and set new password. Invalidates all other active user sessions.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: ChangePasswordRequestSchema,
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
			description: "Password successfully changed",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Current password incorrect or validation failed",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requireStrictSessionAuth);

route.openapi(changePasswordRoute, async (c) => {
	const user = c.get("user");
	const session = c.get("session");
	const { currentPassword, newPassword } = c.req.valid("json");

	if (currentPassword.length > 128) {
		return c.json(
			{
				error: "Current password is incorrect",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);

	if (!user.passwordHash) {
		return c.json(
			{
				error: "Current password is incorrect",
			},
			400,
		);
	}

	const validPassword = await verifyPassword(
		currentPassword,
		user.passwordHash,
	);

	if (!validPassword) {
		return c.json(
			{
				error: "Current password is incorrect",
			},
			400,
		);
	}

	const passwordHash = await hashPassword(newPassword);

	await db
		.update(users)
		.set({
			passwordHash,
			updatedAt: Date.now(),
		})
		.where(eq(users.id, user.id));

	await deleteOtherSessions(db, user.id, session.id);

	await emitNotification(db, {
		userId: user.id,
		type: "security.password_changed",
		category: "security",
		severity: "warning",
		title: "Password Changed",
		message:
			"Your password was recently changed. All other active sessions were revoked.",
		actionUrl: "/account/password",
	});

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
