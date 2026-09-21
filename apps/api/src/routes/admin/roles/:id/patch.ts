import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq, ne } from "drizzle-orm";

import { createDb } from "@/db";
import { roles } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { getUserPermissions } from "@/lib/rbac/permissions";
import { canUserGrantPermissions, getRole, updateRole } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import {
	AdminRoleResponseSchema,
	UpdateRoleRequestSchema,
} from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const patchAdminRoleByIdRoute = createRoute({
	method: "patch",
	path: "/",
	tags: ["Admin Roles"],
	summary: "Update role by ID",
	description: "Updates role name, description, or assigned permissions.",
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
					schema: UpdateRoleRequestSchema,
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
			description: "Role updated successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Invalid payload or cannot rename system role",
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
		409: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Role name collision",
		},
	},
});

route.openapi(patchAdminRoleByIdRoute, async (c) => {
	const { id: roleId } = c.req.valid("param");
	const body = c.req.valid("json");

	const db = createDb(c.env.DB);
	const existing = await getRole(db, roleId);

	if (!existing) {
		return c.json({ error: "Role not found." }, 404);
	}

	if (body.name !== undefined) {
		const newName = body.name.trim();
		if (!newName) {
			return c.json({ error: "Role name cannot be empty." }, 400);
		}

		if (existing.isSystem && newName !== existing.name) {
			return c.json(
				{
					error: "System roles cannot be renamed.",
				},
				400,
			);
		}

		// Check name clash
		const nameClash = await db
			.select({ id: roles.id })
			.from(roles)
			.where(and(eq(roles.name, newName), ne(roles.id, roleId)))
			.limit(1);

		if (nameClash.length > 0) {
			return c.json(
				{
					error: `A role named '${newName}' already exists.`,
				},
				409,
			);
		}
	}

	const adminUser = c.get("user");

	if (body.permissions !== undefined) {
		if (existing.isSystem) {
			return c.json(
				{
					error: "System role permissions cannot be modified.",
				},
				400,
			);
		}

		const callerPermissions = await getUserPermissions(db, adminUser.id);
		if (!canUserGrantPermissions(callerPermissions, body.permissions)) {
			return c.json(
				{
					error:
						"Cannot update role: you do not possess all permissions being granted.",
				},
				403,
			);
		}
	}

	let updated: Awaited<ReturnType<typeof updateRole>>;
	try {
		updated = await updateRole(db, roleId, {
			name: body.name,
			description: body.description,
			permissions: body.permissions,
		});
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to update role.";
		return c.json({ error: message }, 400);
	}

	if (!updated) {
		return c.json({ error: "Role not found." }, 404);
	}

	await emitNotification(db, {
		target: "admins",
		type: "admin.role_updated",
		category: "admin",
		severity: "info",
		title: "Role Updated",
		message: `Admin ${adminUser.email} updated role "${updated.name}".`,
		actionUrl: "/admin/roles",
	});

	return c.json(
		{
			role: updated,
		},
		200,
	);
});

export default route;
