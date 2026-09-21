import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { getRole, removeRolePermission } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { AdminRoleResponseSchema } from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const deleteRolePermissionRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Admin Roles"],
	summary: "Remove permission from role",
	description: "Removes a single permission from the specified role.",
	middleware: [requirePermission("roles:write")] as const,
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "custom_role",
				description: "Role ID",
			}),
			permissionId: z.string().openapi({
				param: {
					name: "permissionId",
					in: "path",
				},
				example: "users:write",
				description: "Permission ID to remove",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdminRoleResponseSchema,
				},
			},
			description: "Permission removed from role",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Cannot modify system role or invalid ID",
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
			description: "Role not found",
		},
	},
});

route.openapi(deleteRolePermissionRoute, async (c) => {
	const { id: roleId, permissionId } = c.req.valid("param");

	const db = createDb(c.env.DB);
	const role = await getRole(db, roleId);

	if (!role) {
		return c.json({ error: "Role not found." }, 404);
	}

	if (role.isSystem && role.id !== SYSTEM_ROLE_IDS.EVERYONE) {
		return c.json(
			{
				error: "System role permissions cannot be modified.",
			},
			400,
		);
	}

	const updated = await removeRolePermission(db, roleId, permissionId);

	if (!updated) {
		return c.json({ error: "Role not found." }, 404);
	}

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.role_permission_removed",
		category: "admin",
		severity: "info",
		title: "Permission Removed from Role",
		message: `Admin ${adminUser.email} removed permission "${permissionId}" from role "${role.name}".`,
		actionUrl: `/admin/roles?roleId=${role.id}`,
	});

	return c.json(
		{
			role: updated,
		},
		200,
	);
});

export default route;
