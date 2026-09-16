import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { roles, users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { revokeUserRole } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.delete("/", requirePermission("roles:assign"), async (c) => {
	const userId = c.req.param("userId");
	const roleId = c.req.param("roleId");

	if (!userId || !roleId) {
		return c.json({ error: "User ID and Role ID are required." }, 400);
	}

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

	await revokeUserRole(db, userId, roleId);

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.user_role_revoked",
		category: "admin",
		severity: "info",
		title: "User Role Revoked",
		message: `Admin ${adminUser.email} revoked role "${targetRole?.name ?? roleId}" from user ${targetUser.email}.`,
		actionUrl: `/admin/users?userId=${targetUser.id}`,
	});

	return c.body(null, 204);
});

export default route;
