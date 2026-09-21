import { deleteCookie } from "hono/cookie";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { deleteUser } from "@/lib/lifecycle/actions/delete";
import { emitNotification } from "@/lib/notifications/emitter";
import { verifyPassword } from "@/lib/password";
import { isSoleAdministrator } from "@/lib/rbac/permissions";
import {
	type AppEnv,
	requireElevatedSession,
	requireStrictSessionAuth,
} from "@/middleware/auth";
import { DeleteAccountRequestSchema } from "@/schemas/account";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

export const deleteAccountRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Account & Profile"],
	summary: "Delete user account",
	description:
		"Permanently delete caller user account and all associated data after optional password confirmation.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: DeleteAccountRequestSchema,
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
			description: "Account successfully deleted",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Sole administrator or incorrect password confirmation",
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

route.use("/*", requireStrictSessionAuth, requireElevatedSession);

route.openapi(deleteAccountRoute, async (c) => {
	const user = c.get("user");
	const db = createDb(c.env.DB);

	const isSoleAdmin = await isSoleAdministrator(db, user.id);
	if (isSoleAdmin) {
		return c.json(
			{
				error:
					"Cannot delete your account because you are the only remaining active administrator. Promote another user first.",
			},
			400,
		);
	}

	const body = c.req.valid("json");

	if (user.passwordHash) {
		if (!body?.password) {
			return c.json(
				{
					error: "Password confirmation is required to delete your account.",
				},
				400,
			);
		}

		const validPassword = await verifyPassword(
			body.password,
			user.passwordHash,
		);
		if (!validPassword) {
			return c.json(
				{
					error: "Password confirmation is incorrect.",
				},
				400,
			);
		}
	}

	await deleteUser(db, user.id, { profileBucket: c.env.PROFILE_BUCKET });

	await emitNotification(db, {
		target: "admins",
		type: "account.deleted",
		category: "admin",
		severity: "info",
		title: "User Deleted Account",
		message: `User ${user.email} permanently deleted their own account.`,
		actionUrl: "/admin/users",
	});

	deleteCookie(c, "session_token", { path: "/" });
	deleteCookie(c, "auth_token", { path: "/" });

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
