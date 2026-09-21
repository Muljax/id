import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { deleteUser } from "@/lib/lifecycle/actions/delete";
import { emitNotification } from "@/lib/notifications/emitter";
import { isSoleAdministrator } from "@/lib/rbac/permissions";
import {
	type AppEnv,
	requireElevatedSession,
	requirePermission,
} from "@/middleware/auth";
import { DeleteUserResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const deleteAdminUserRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Admin Users"],
	summary: "Delete user account",
	description: "Permanently deletes a user account and associated credentials.",
	middleware: [
		requirePermission("users:delete"),
		requireElevatedSession,
	] as const,
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
					schema: DeleteUserResponseSchema,
				},
			},
			description: "User deleted successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description:
				"Bad request - Cannot delete own account or last remaining admin",
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

route.openapi(deleteAdminUserRoute, async (c) => {
	const { userId } = c.req.valid("param");

	const currentUser = c.get("user");
	if (currentUser && userId === currentUser.id) {
		return c.json(
			{
				error:
					"You cannot delete your own account via the admin API. Use the account settings endpoint.",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);
	const [targetUser] = await db
		.select({ id: users.id, email: users.email })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!targetUser) {
		return c.json({ error: "User not found." }, 404);
	}

	const isSoleAdmin = await isSoleAdministrator(db, userId);
	if (isSoleAdmin) {
		return c.json(
			{
				error:
					"Cannot delete the last remaining active administrator account. Promote another user first.",
			},
			400,
		);
	}

	await deleteUser(db, userId, { profileBucket: c.env.PROFILE_BUCKET });

	await emitNotification(db, {
		target: "admins",
		type: "admin.user_deleted",
		category: "admin",
		severity: "warning",
		title: "User Account Deleted",
		message: `Account ${targetUser.email} was permanently deleted by an administrator.`,
		actionUrl: "/admin/users",
	});

	return c.json(
		{
			success: true,
			userId,
		},
		200,
	);
});

export default route;
