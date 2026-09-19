import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { getUserPermissions } from "@/lib/rbac/permissions";
import { canUserAssignRoles, setUserRoles } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.put("/", requirePermission("roles:assign"), async (c) => {
	const userId = c.req.param("userId");

	if (!userId) {
		return c.json({ error: "User ID is required." }, 400);
	}

	const body = await c.req
		.json<{
			roleIds?: string[];
		}>()
		.catch(() => null);

	if (!body || !Array.isArray(body.roleIds)) {
		return c.json(
			{
				error: "roleIds array is required.",
			},
			400,
		);
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

	const adminUser = c.get("user");
	const callerPermissions = await getUserPermissions(db, adminUser.id);
	const check = await canUserAssignRoles(db, callerPermissions, body.roleIds);
	if (!check.allowed) {
		return c.json(
			{
				error:
					"Cannot assign roles: you do not possess all permissions granted by one or more selected roles.",
				missingPermissions: check.missingPermissions,
			},
			403,
		);
	}

	const updatedRoles = await setUserRoles(
		db,
		userId,
		body.roleIds,
		adminUser?.id,
	);

	await emitNotification(db, {
		target: "admins",
		type: "admin.user_roles_updated",
		category: "admin",
		severity: "info",
		title: "User Roles Updated",
		message: `Admin ${adminUser.email} updated roles for user ${targetUser.email}.`,
		actionUrl: `/admin/users?userId=${targetUser.id}`,
	});

	return c.json({
		userId: targetUser.id,
		roles: updatedRoles,
	});
});

export default route;
