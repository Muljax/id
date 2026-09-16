import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { roles, users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { assignUserRole } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post("/", requirePermission("roles:assign"), async (c) => {
	const userId = c.req.param("userId");

	if (!userId) {
		return c.json({ error: "User ID is required." }, 400);
	}

	const body = await c.req
		.json<{
			roleId?: string;
		}>()
		.catch(() => null);

	if (!body || typeof body.roleId !== "string" || !body.roleId.trim()) {
		return c.json(
			{
				error: "roleId is required.",
			},
			400,
		);
	}

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

	return c.json({
		userId: targetUser.id,
		roles: updatedRoles,
	});
});

export default route;
