import { and, eq, ne } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { roles } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { getRole, updateRole } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.patch("/", requirePermission("roles:write"), async (c) => {
	const roleId = c.req.param("id");

	if (!roleId) {
		return c.json({ error: "Role ID is required." }, 400);
	}

	const body = await c.req
		.json<{
			name?: string;
			description?: string;
			permissions?: string[];
		}>()
		.catch(() => null);

	if (!body || typeof body !== "object") {
		return c.json({ error: "Request body must be a JSON object." }, 400);
	}

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

	if (body.permissions !== undefined && !Array.isArray(body.permissions)) {
		return c.json(
			{
				error: "Permissions must be an array of strings.",
			},
			400,
		);
	}

	const updated = await updateRole(db, roleId, {
		name: body.name,
		description: body.description,
		permissions: body.permissions,
	});

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.role_updated",
		category: "admin",
		severity: "info",
		title: "Role Updated",
		message: `Admin ${adminUser.email} updated role "${updated?.name ?? roleId}".`,
		actionUrl: "/admin/roles",
	});

	return c.json({
		role: updated,
	});
});

export default route;
