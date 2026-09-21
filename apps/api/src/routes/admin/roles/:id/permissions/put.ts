import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { getUserPermissions } from "@/lib/rbac/permissions";
import {
	canUserGrantPermissions,
	getRole,
	setRolePermissions,
} from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import {
	AdminRoleResponseSchema,
	SetRolePermissionsRequestSchema,
} from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const setRolePermissionsRoute = createRoute({
	method: "put",
	path: "/",
	tags: ["Admin Roles"],
	summary: "Set role permissions",
	description: "Replaces the entire set of permissions for the specified role.",
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
		}),
		body: {
			content: {
				"application/json": {
					schema: SetRolePermissionsRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdminRoleResponseSchema,
				},
			},
			description: "Role permissions updated successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Cannot modify system role or invalid payload",
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

route.openapi(setRolePermissionsRoute, async (c) => {
	const { id: roleId } = c.req.valid("param");
	const body = c.req.valid("json");

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

	const adminUser = c.get("user");
	const callerPermissions = await getUserPermissions(db, adminUser.id);
	if (!canUserGrantPermissions(callerPermissions, body.permissions)) {
		return c.json(
			{
				error:
					"Cannot update permissions: you do not possess all permissions being granted.",
			},
			403,
		);
	}

	let updated: Awaited<ReturnType<typeof setRolePermissions>>;
	try {
		updated = await setRolePermissions(db, roleId, body.permissions);
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to update permissions.";
		return c.json({ error: message }, 400);
	}

	if (!updated) {
		return c.json({ error: "Role not found." }, 404);
	}

	await emitNotification(db, {
		target: "admins",
		type: "admin.role_permissions_updated",
		category: "admin",
		severity: "info",
		title: "Role Permissions Updated",
		message: `Admin ${adminUser.email} updated permissions for role "${role.name}".`,
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
