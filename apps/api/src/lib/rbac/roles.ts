import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db";
import { permissions, rolePermissions, roles, userRoles } from "@/db/schema";
import { isReadOnlyPermission, SYSTEM_ROLE_IDS } from "./constants";
import { hasPermission } from "./matcher";

export function canUserGrantPermissions(
	callerPermissions: ReadonlySet<string>,
	permissionsToGrant: string[],
): boolean {
	if (hasPermission(callerPermissions, "*")) {
		return true;
	}
	return permissionsToGrant.every((p) => hasPermission(callerPermissions, p));
}

export async function canUserAssignRoles(
	db: Database,
	callerPermissions: ReadonlySet<string>,
	roleIds: string[],
): Promise<{ allowed: boolean; missingPermissions?: string[] }> {
	if (hasPermission(callerPermissions, "*")) {
		return { allowed: true };
	}

	if (roleIds.includes(SYSTEM_ROLE_IDS.ADMIN)) {
		return { allowed: false, missingPermissions: ["*"] };
	}

	if (roleIds.length === 0) {
		return { allowed: true };
	}

	const rolePermRows = await db
		.select({ permissionId: rolePermissions.permissionId })
		.from(rolePermissions)
		.where(inArray(rolePermissions.roleId, roleIds));

	const missing = new Set<string>();
	for (const row of rolePermRows) {
		if (!hasPermission(callerPermissions, row.permissionId)) {
			missing.add(row.permissionId);
		}
	}

	if (missing.size > 0) {
		return {
			allowed: false,
			missingPermissions: Array.from(missing),
		};
	}

	return { allowed: true };
}

export async function listRoles(db: Database) {
	const allRoles = await db.select().from(roles).orderBy(roles.createdAt);
	const allRolePerms = await db.select().from(rolePermissions);

	const permsByRole = new Map<string, string[]>();
	for (const rp of allRolePerms) {
		const list = permsByRole.get(rp.roleId) ?? [];
		list.push(rp.permissionId);
		permsByRole.set(rp.roleId, list);
	}

	return allRoles.map((role) => ({
		...role,
		permissions: permsByRole.get(role.id) ?? [],
	}));
}

export async function getRole(db: Database, roleId: string) {
	const [role] = await db
		.select()
		.from(roles)
		.where(eq(roles.id, roleId))
		.limit(1);

	if (!role) {
		return null;
	}

	const perms = await db
		.select({ permissionId: rolePermissions.permissionId })
		.from(rolePermissions)
		.where(eq(rolePermissions.roleId, roleId));

	return {
		...role,
		permissions: perms.map((p) => p.permissionId),
	};
}

export async function createRole(
	db: Database,
	input: {
		name: string;
		description?: string;
		permissions?: string[];
	},
) {
	const now = Date.now();
	const id = crypto.randomUUID();
	const trimmedName = input.name.trim();

	await db.insert(roles).values({
		id,
		name: trimmedName,
		description: input.description?.trim() || null,
		isSystem: false,
		createdAt: now,
		updatedAt: now,
	});

	if (input.permissions && input.permissions.length > 0) {
		const uniquePerms = Array.from(new Set(input.permissions));
		const allPerms = await db.select({ id: permissions.id }).from(permissions);
		const validPermSet = new Set(allPerms.map((p) => p.id));
		const validPerms = uniquePerms.filter((p) => validPermSet.has(p));

		if (validPerms.length > 0) {
			await db
				.insert(rolePermissions)
				.values(
					validPerms.map((permId) => ({
						roleId: id,
						permissionId: permId,
						createdAt: now,
					})),
				)
				.onConflictDoNothing({
					target: [rolePermissions.roleId, rolePermissions.permissionId],
				});
		}
	}

	return getRole(db, id);
}

export async function updateRole(
	db: Database,
	roleId: string,
	input: {
		name?: string;
		description?: string;
		permissions?: string[];
	},
) {
	const existing = await getRole(db, roleId);
	if (!existing) {
		return null;
	}

	if (existing.isSystem && input.permissions !== undefined) {
		throw new Error("System role permissions cannot be modified.");
	}

	const now = Date.now();
	const updates: Partial<typeof roles.$inferInsert> = {
		updatedAt: now,
	};

	if (input.name !== undefined) {
		updates.name = input.name.trim();
	}

	if (input.description !== undefined) {
		updates.description = input.description.trim() || null;
	}

	await db.update(roles).set(updates).where(eq(roles.id, roleId));

	if (input.permissions !== undefined) {
		await setRolePermissions(db, roleId, input.permissions);
	}

	return getRole(db, roleId);
}

export async function deleteRole(
	db: Database,
	roleId: string,
): Promise<{ success: boolean; error?: string }> {
	const role = await getRole(db, roleId);
	if (!role) {
		return { success: false, error: "Role not found" };
	}

	if (role.isSystem) {
		return { success: false, error: "System roles cannot be deleted" };
	}

	await db.delete(roles).where(eq(roles.id, roleId));
	return { success: true };
}

export async function setRolePermissions(
	db: Database,
	roleId: string,
	permissionIds: string[],
) {
	const role = await getRole(db, roleId);
	if (!role) {
		throw new Error("Role not found");
	}

	if (role.isSystem && roleId !== SYSTEM_ROLE_IDS.EVERYONE) {
		throw new Error("System role permissions cannot be modified.");
	}

	const now = Date.now();
	const uniquePerms = Array.from(new Set(permissionIds));

	if (roleId === SYSTEM_ROLE_IDS.EVERYONE) {
		const nonRead = uniquePerms.filter((p) => !isReadOnlyPermission(p));
		if (nonRead.length > 0) {
			throw new Error(
				`The 'everyone' role can only be assigned read-only permissions (ending in ':read'). Invalid: ${nonRead.join(", ")}`,
			);
		}
	}

	await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

	if (uniquePerms.length > 0) {
		const allPerms = await db.select({ id: permissions.id }).from(permissions);
		const validPermSet = new Set(allPerms.map((p) => p.id));
		const validPerms = uniquePerms.filter((id) => validPermSet.has(id));

		if (validPerms.length > 0) {
			await db
				.insert(rolePermissions)
				.values(
					validPerms.map((permId) => ({
						roleId,
						permissionId: permId,
						createdAt: now,
					})),
				)
				.onConflictDoNothing({
					target: [rolePermissions.roleId, rolePermissions.permissionId],
				});
		}
	}

	return getRole(db, roleId);
}

export async function addRolePermissions(
	db: Database,
	roleId: string,
	permissionIds: string[],
) {
	const role = await getRole(db, roleId);
	if (!role) {
		throw new Error("Role not found");
	}

	if (role.isSystem && roleId !== SYSTEM_ROLE_IDS.EVERYONE) {
		throw new Error("System role permissions cannot be modified.");
	}

	const now = Date.now();
	const uniquePerms = Array.from(new Set(permissionIds));

	if (roleId === SYSTEM_ROLE_IDS.EVERYONE) {
		const nonRead = uniquePerms.filter((p) => !isReadOnlyPermission(p));
		if (nonRead.length > 0) {
			throw new Error(
				`The 'everyone' role can only be assigned read-only permissions (ending in ':read'). Invalid: ${nonRead.join(", ")}`,
			);
		}
	}

	if (uniquePerms.length > 0) {
		const allPerms = await db.select({ id: permissions.id }).from(permissions);
		const validPermSet = new Set(allPerms.map((p) => p.id));
		const validPerms = uniquePerms.filter((id) => validPermSet.has(id));

		if (validPerms.length > 0) {
			await db
				.insert(rolePermissions)
				.values(
					validPerms.map((permId) => ({
						roleId,
						permissionId: permId,
						createdAt: now,
					})),
				)
				.onConflictDoNothing({
					target: [rolePermissions.roleId, rolePermissions.permissionId],
				});
		}
	}

	return getRole(db, roleId);
}

export async function removeRolePermission(
	db: Database,
	roleId: string,
	permissionId: string,
) {
	const role = await getRole(db, roleId);
	if (!role) {
		throw new Error("Role not found");
	}

	if (role.isSystem && roleId !== SYSTEM_ROLE_IDS.EVERYONE) {
		throw new Error("System role permissions cannot be modified.");
	}

	await db
		.delete(rolePermissions)
		.where(
			and(
				eq(rolePermissions.roleId, roleId),
				eq(rolePermissions.permissionId, permissionId),
			),
		);

	return getRole(db, roleId);
}

export async function getUserRolesDetailed(db: Database, userId: string) {
	return await db
		.select({
			roleId: userRoles.roleId,
			roleName: roles.name,
			description: roles.description,
			isSystem: roles.isSystem,
			assignedAt: userRoles.assignedAt,
			assignedBy: userRoles.assignedBy,
		})
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(userRoles.userId, userId));
}

export async function setUserRoles(
	db: Database,
	userId: string,
	roleIds: string[],
	assignedBy?: string,
) {
	const now = Date.now();
	const uniqueRoleIds = Array.from(new Set(roleIds));

	if (uniqueRoleIds.includes(SYSTEM_ROLE_IDS.EVERYONE)) {
		throw new Error(
			"The 'everyone' role is universal and cannot be manually assigned to individual users.",
		);
	}

	await db.delete(userRoles).where(eq(userRoles.userId, userId));

	if (uniqueRoleIds.length > 0) {
		await db
			.insert(userRoles)
			.values(
				uniqueRoleIds.map((roleId) => ({
					userId,
					roleId,
					assignedAt: now,
					assignedBy: assignedBy ?? null,
				})),
			)
			.onConflictDoNothing();
	}

	return getUserRolesDetailed(db, userId);
}

export async function assignUserRole(
	db: Database,
	userId: string,
	roleId: string,
	assignedBy?: string,
) {
	if (roleId === SYSTEM_ROLE_IDS.EVERYONE) {
		throw new Error(
			"The 'everyone' role is universal and cannot be manually assigned to individual users.",
		);
	}

	const now = Date.now();

	await db
		.insert(userRoles)
		.values({
			userId,
			roleId,
			assignedAt: now,
			assignedBy: assignedBy ?? null,
		})
		.onConflictDoNothing();

	return getUserRolesDetailed(db, userId);
}

export async function revokeUserRole(
	db: Database,
	userId: string,
	roleId: string,
) {
	await db
		.delete(userRoles)
		.where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));

	return getUserRolesDetailed(db, userId);
}

export async function listAllPermissions(db: Database) {
	return db
		.select()
		.from(permissions)
		.orderBy(permissions.resource, permissions.id);
}
