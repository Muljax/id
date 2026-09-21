import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { deleteRole, getRole } from "@/lib/rbac/roles";
import {
	type AppEnv,
	requireElevatedSession,
	requirePermission,
} from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const deleteAdminRoleByIdRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Admin Roles"],
	summary: "Delete role by ID",
	description: "Deletes a custom role. System roles cannot be deleted.",
	middleware: [
		requirePermission("roles:write"),
		requireElevatedSession,
	] as const,
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
		}),
	},
	responses: {
		204: {
			description: "Role deleted successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description:
				"Bad request - Cannot delete system role or failed to delete",
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

route.openapi(deleteAdminRoleByIdRoute, async (c) => {
	const { id: roleId } = c.req.valid("param");

	const db = createDb(c.env.DB);
	const existing = await getRole(db, roleId);

	if (!existing) {
		return c.json({ error: "Role not found." }, 404);
	}

	if (existing.isSystem) {
		return c.json(
			{
				error: "System roles cannot be deleted.",
			},
			400,
		);
	}

	const result = await deleteRole(db, roleId);

	if (!result.success) {
		return c.json({ error: result.error ?? "Failed to delete role." }, 400);
	}

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.role_deleted",
		category: "admin",
		severity: "warning",
		title: "Role Deleted",
		message: `Admin ${adminUser.email} deleted role "${existing.name}".`,
		actionUrl: "/admin/roles",
	});

	return c.body(null, 204);
});

export default route;
