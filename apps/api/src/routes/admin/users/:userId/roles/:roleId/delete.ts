import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { roles, users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { revokeUserRole } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const revokeAdminUserRoleRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Admin Users"],
	summary: "Revoke role from user",
	description: "Removes an assigned role from a specific user.",
	middleware: [requirePermission("roles:assign")] as const,
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
			roleId: z.string().openapi({
				param: {
					name: "roleId",
					in: "path",
				},
				example: "custom_role",
				description: "Role ID to revoke",
			}),
		}),
	},
	responses: {
		204: {
			description: "Role revoked successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing user or role ID",
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

route.openapi(revokeAdminUserRoleRoute, async (c) => {
	const { userId, roleId } = c.req.valid("param");

	const db = createDb(c.env.DB);

	const [targetUser] = await db
		.select({ id: users.id, email: users.email })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!targetUser) {
		return c.json({ error: "User not found." }, 404);
	}

	const [targetRole] = await db
		.select({ id: roles.id, name: roles.name })
		.from(roles)
		.where(eq(roles.id, roleId))
		.limit(1);

	await revokeUserRole(db, userId, roleId);

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.user_role_revoked",
		category: "admin",
		severity: "info",
		title: "User Role Revoked",
		message: `Admin ${adminUser.email} revoked role "${targetRole?.name ?? roleId}" from user ${targetUser.email}.`,
		actionUrl: `/admin/users?userId=${targetUser.id}`,
	});

	return c.body(null, 204);
});

export default route;
