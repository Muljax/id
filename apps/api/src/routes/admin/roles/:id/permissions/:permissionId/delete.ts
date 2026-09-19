import { Hono } from "hono";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { getRole, removeRolePermission } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.delete("/", requirePermission("roles:write"), async (c) => {
	const roleId = c.req.param("id");
	const permissionId = c.req.param("permissionId");

	if (!roleId || !permissionId) {
		return c.json({ error: "Role ID and Permission ID are required." }, 400);
	}

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

	return c.json({
		role: updated,
	});
});

export default route;
