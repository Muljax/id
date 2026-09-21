import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { getUserPermissions } from "@/lib/rbac/permissions";
import { canUserAssignRoles, setUserRoles } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import {
	SetUserRolesRequestSchema,
	UserRolesResponseSchema,
} from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const setUserRolesRoute = createRoute({
	method: "put",
	path: "/",
	tags: ["Admin Users"],
	summary: "Set assigned roles for user",
	description:
		"Replaces the entire set of assigned roles for the specified user. Caller must hold all permissions granted by each role.",
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
		}),
		body: {
			content: {
				"application/json": {
					schema: SetUserRolesRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UserRolesResponseSchema,
				},
			},
			description: "User roles updated successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing user ID or invalid role list",
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
			description:
				"Forbidden - Insufficient permissions to assign one or more roles",
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

route.openapi(setUserRolesRoute, async (c) => {
	const { userId } = c.req.valid("param");
	const body = c.req.valid("json");

	const db = createDb(c.env.DB);

	const [targetUser] = await db
		.select({ id: users.id, email: users.email })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!targetUser) {
		return c.json({ error: "User not found." }, 404);
	}

	const adminUser = c.get("user");
	const callerPermissions = await getUserPermissions(db, adminUser.id);
	const check = await canUserAssignRoles(db, callerPermissions, body.roleIds);
	if (!check.allowed) {
		return c.json(
			{
				error:
					"Cannot assign roles: you do not possess all permissions granted by one or more selected roles.",
				missingPermissions: check.missingPermissions,
			},
			403,
		);
	}

	const updatedRoles = await setUserRoles(
		db,
		userId,
		body.roleIds,
		adminUser?.id,
	);

	await emitNotification(db, {
		target: "admins",
		type: "admin.user_roles_updated",
		category: "admin",
		severity: "info",
		title: "User Roles Updated",
		message: `Admin ${adminUser.email} updated roles for user ${targetUser.email}.`,
		actionUrl: `/admin/users?userId=${targetUser.id}`,
	});

	return c.json(
		{
			userId: targetUser.id,
			roles: updatedRoles,
		},
		200,
	);
});

export default route;
