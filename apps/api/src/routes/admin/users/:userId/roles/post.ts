import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { roles, users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { getUserPermissions } from "@/lib/rbac/permissions";
import { assignUserRole, canUserAssignRoles } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import {
	AssignUserRoleRequestSchema,
	UserRolesResponseSchema,
} from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const assignAdminUserRoleRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Admin Users"],
	summary: "Assign role to user",
	description:
		"Assigns an additional role to the user. Caller must hold all permissions that this role grants.",
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
					schema: AssignUserRoleRequestSchema,
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
			description: "Role assigned successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Missing user ID or invalid role",
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
			description: "Forbidden - Insufficient permissions to assign this role",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "User or role not found",
		},
	},
});

route.openapi(assignAdminUserRoleRoute, async (c) => {
	const { userId } = c.req.valid("param");
	const body = c.req.valid("json");
	const roleId = body.roleId.trim();

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

	if (!targetRole) {
		return c.json({ error: "Role not found." }, 404);
	}

	const adminUser = c.get("user");
	const callerPermissions = await getUserPermissions(db, adminUser.id);
	const check = await canUserAssignRoles(db, callerPermissions, [roleId]);
	if (!check.allowed) {
		return c.json(
			{
				error:
					"Cannot assign role: you do not possess all permissions granted by this role.",
			},
			403,
		);
	}

	const updatedRoles = await assignUserRole(db, userId, roleId, adminUser?.id);

	await emitNotification(db, {
		target: "admins",
		type: "admin.user_role_assigned",
		category: "admin",
		severity: "info",
		title: "User Role Assigned",
		message: `Admin ${adminUser.email} assigned role "${targetRole.name}" to user ${targetUser.email}.`,
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
