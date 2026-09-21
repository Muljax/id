import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { roles } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { getUserPermissions } from "@/lib/rbac/permissions";
import { canUserGrantPermissions, createRole } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import {
	AdminRoleResponseSchema,
	CreateRoleRequestSchema,
} from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const createAdminRoleRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Admin Roles"],
	summary: "Create a new role",
	description:
		"Creates a custom role with a set of permissions. Caller must hold all granted permissions.",
	middleware: [requirePermission("roles:write")] as const,
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateRoleRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: AdminRoleResponseSchema,
				},
			},
			description: "Role created successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Invalid role payload",
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
			description: "Forbidden - Insufficient permissions to grant these roles",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Role name already exists",
		},
	},
});

route.openapi(createAdminRoleRoute, async (c) => {
	const body = c.req.valid("json");
	const roleName = body.name.trim();

	const db = createDb(c.env.DB);

	const existing = await db
		.select({ id: roles.id })
		.from(roles)
		.where(eq(roles.name, roleName))
		.limit(1);

	if (existing.length > 0) {
		return c.json(
			{
				error: `A role named '${roleName}' already exists.`,
			},
			409,
		);
	}

	const adminUser = c.get("user");
	if (body.permissions && body.permissions.length > 0) {
		const callerPermissions = await getUserPermissions(db, adminUser.id);
		if (!canUserGrantPermissions(callerPermissions, body.permissions)) {
			return c.json(
				{
					error:
						"Cannot create role: you do not possess all permissions being granted.",
				},
				403,
			);
		}
	}

	const newRole = await createRole(db, {
		name: roleName,
		description: body.description,
		permissions: body.permissions,
	});

	if (!newRole) {
		return c.json({ error: "Failed to create role." }, 400);
	}

	await emitNotification(db, {
		target: "admins",
		type: "admin.role_created",
		category: "admin",
		severity: "info",
		title: "Role Created",
		message: `Admin ${adminUser.email} created role "${roleName}".`,
		actionUrl: "/admin/roles",
	});

	return c.json(
		{
			role: newRole,
		},
		201,
	);
});

export default route;
