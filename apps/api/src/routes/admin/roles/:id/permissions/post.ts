import { Hono } from "hono";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { getUserPermissions } from "@/lib/rbac/permissions";
import {
	addRolePermissions,
	canUserGrantPermissions,
	getRole,
} from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post("/", requirePermission("roles:write"), async (c) => {
	const roleId = c.req.param("id");

	if (!roleId) {
		return c.json({ error: "Role ID is required." }, 400);
	}

	const body = await c.req
		.json<{
			permissions?: string[];
		}>()
		.catch(() => null);

	if (
		!body ||
		!Array.isArray(body.permissions) ||
		body.permissions.length === 0
	) {
		return c.json(
			{
				error: "A non-empty permissions array is required.",
			},
			400,
		);
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

	const adminUser = c.get("user");
	const callerPermissions = await getUserPermissions(db, adminUser.id);
	if (!canUserGrantPermissions(callerPermissions, body.permissions)) {
		return c.json(
			{
				error:
					"Cannot add permissions: you do not possess all permissions being granted.",
			},
			403,
		);
	}

	let updated: Awaited<ReturnType<typeof addRolePermissions>>;
	try {
		updated = await addRolePermissions(db, roleId, body.permissions);
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to add permissions.";
		return c.json({ error: message }, 400);
	}

	await emitNotification(db, {
		target: "admins",
		type: "admin.role_permissions_added",
		category: "admin",
		severity: "info",
		title: "Permissions Added to Role",
		message: `Admin ${adminUser.email} added ${body.permissions.length} permission(s) to role "${role.name}".`,
		actionUrl: `/admin/roles?roleId=${role.id}`,
	});

	return c.json({
		role: updated,
	});
});

export default route;
