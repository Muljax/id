import { eq } from "drizzle-orm";
import type { Database } from "@/db";
import { rolePermissions, userRoles } from "@/db/schema";
import { hasPermission } from "./matcher";

export async function getUserRoles(
	db: Database,
	userId: string,
): Promise<string[]> {
	const records = await db
		.select({ roleId: userRoles.roleId })
		.from(userRoles)
		.where(eq(userRoles.userId, userId));

	return records.map((r) => r.roleId);
}

export async function getUserEffectivePermissions(
	db: Database,
	userId: string,
): Promise<{ roles: string[]; permissions: Set<string> }> {
	const rows = await db
		.select({
			roleId: userRoles.roleId,
			permissionId: rolePermissions.permissionId,
		})
		.from(userRoles)
		.leftJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
		.where(eq(userRoles.userId, userId));

	const roleSet = new Set<string>();
	const permissionSet = new Set<string>();

	for (const row of rows) {
		roleSet.add(row.roleId);
		if (row.permissionId) {
			permissionSet.add(row.permissionId);
		}
	}

	return {
		roles: Array.from(roleSet),
		permissions: permissionSet,
	};
}

export async function getUserPermissions(
	db: Database,
	userId: string,
): Promise<Set<string>> {
	const { permissions } = await getUserEffectivePermissions(db, userId);
	return permissions;
}

export async function isUserAdmin(
	db: Database,
	userId: string,
): Promise<boolean> {
	const { roles, permissions } = await getUserEffectivePermissions(db, userId);
	return hasPermission(permissions, "*") || roles.includes("admin");
}
