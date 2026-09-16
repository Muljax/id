import { Hono } from "hono";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { deleteRole, getRole } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.delete("/", requirePermission("roles:write"), async (c) => {
	const roleId = c.req.param("id");

	if (!roleId) {
		return c.json({ error: "Role ID is required." }, 400);
	}

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
