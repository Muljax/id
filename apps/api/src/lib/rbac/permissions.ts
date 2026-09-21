import { eq } from "drizzle-orm";
import type { Database } from "@/db";
import { rolePermissions, userRoles, users } from "@/db/schema";
import { SYSTEM_ROLE_IDS } from "./constants";
import { hasPermission } from "./matcher";

export async function getUserRoles(
	db: Database,
	userId: string,
): Promise<string[]> {
	const records = await db
		.select({ roleId: userRoles.roleId })
		.from(userRoles)
		.where(eq(userRoles.userId, userId));

	const roles = records.map((r) => r.roleId);
	if (!roles.includes(SYSTEM_ROLE_IDS.EVERYONE)) {
		roles.push(SYSTEM_ROLE_IDS.EVERYONE);
	}
	return roles;
}

export async function getEveryoneRolePermissions(
	db: Database,
): Promise<Set<string>> {
	try {
		const rows = await db
			.select({ permissionId: rolePermissions.permissionId })
			.from(rolePermissions)
			.where(eq(rolePermissions.roleId, SYSTEM_ROLE_IDS.EVERYONE));

		if (rows.length === 0) {
			return new Set(["ssh:ca:read"]);
		}

		return new Set(rows.map((r) => r.permissionId));
	} catch {
		return new Set(["ssh:ca:read"]);
	}
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

	// Always grant the universal "everyone" role & its permissions to all users
	roleSet.add(SYSTEM_ROLE_IDS.EVERYONE);
	const everyonePerms = await getEveryoneRolePermissions(db);
	for (const perm of everyonePerms) {
		permissionSet.add(perm);
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
	return (
		hasPermission(permissions, "*") || roles.includes(SYSTEM_ROLE_IDS.ADMIN)
	);
}

/**
 * Checks whether a user is the only remaining active administrator.
 *
 * @param db Database instance.
 * @param userId User identifier to test.
 * @returns True if the user is the only active administrator.
 */
export async function isSoleAdministrator(
	db: Database,
	userId: string,
): Promise<boolean> {
	const userIsAdmin = await isUserAdmin(db, userId);
	if (!userIsAdmin) {
		return false;
	}

	const allUsers = await db
		.select({
			id: users.id,
			disabledAt: users.disabledAt,
		})
		.from(users);

	let activeAdminCount = 0;
	for (const u of allUsers) {
		if (u.disabledAt === null) {
			const adminStatus = await isUserAdmin(db, u.id);
			if (adminStatus) {
				activeAdminCount++;
				if (activeAdminCount > 1) {
					return false;
				}
			}
		}
	}

	return activeAdminCount <= 1;
}
