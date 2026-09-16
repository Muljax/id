import { and, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { permissions, rolePermissions, roles, userRoles } from "@/db/schema";

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
		await db
			.insert(rolePermissions)
			.values(
				uniquePerms.map((permId) => ({
					roleId: id,
					permissionId: permId,
					createdAt: now,
				})),
			)
			.onConflictDoNothing();
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
	const now = Date.now();
	const uniquePerms = Array.from(new Set(permissionIds));

	await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

	if (uniquePerms.length > 0) {
		await db
			.insert(rolePermissions)
			.values(
				uniquePerms.map((permId) => ({
					roleId,
					permissionId: permId,
					createdAt: now,
				})),
			)
			.onConflictDoNothing();
	}

	return getRole(db, roleId);
}

export async function addRolePermissions(
	db: Database,
	roleId: string,
	permissionIds: string[],
) {
	const now = Date.now();
	const uniquePerms = Array.from(new Set(permissionIds));

	if (uniquePerms.length > 0) {
		await db
			.insert(rolePermissions)
			.values(
				uniquePerms.map((permId) => ({
					roleId,
					permissionId: permId,
					createdAt: now,
				})),
			)
			.onConflictDoNothing();
	}

	return getRole(db, roleId);
}

export async function removeRolePermission(
	db: Database,
	roleId: string,
	permissionId: string,
) {
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
