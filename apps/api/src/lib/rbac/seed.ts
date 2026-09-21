import type { Database } from "@/db";
import { permissions, rolePermissions, roles } from "@/db/schema";
import { DEFAULT_ROLES, SYSTEM_PERMISSIONS } from "./constants";

export async function seedRbacData(db: Database) {
	const now = Date.now();

	await db
		.insert(permissions)
		.values(
			SYSTEM_PERMISSIONS.map((perm) => ({
				id: perm.id,
				name: perm.name,
				description: perm.description,
				resource: perm.resource,
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			})),
		)
		.onConflictDoNothing({ target: permissions.id });

	await db
		.insert(roles)
		.values(
			DEFAULT_ROLES.map((roleDef) => ({
				id: roleDef.id,
				name: roleDef.name,
				description: roleDef.description,
				isSystem: roleDef.isSystem,
				createdAt: now,
				updatedAt: now,
			})),
		)
		.onConflictDoNothing({ target: roles.id });

	const rolePerms = DEFAULT_ROLES.flatMap((roleDef) =>
		roleDef.permissions.map((permId) => ({
			roleId: roleDef.id,
			permissionId: permId,
			createdAt: now,
		})),
	);

	if (rolePerms.length > 0) {
		await db
			.insert(rolePermissions)
			.values(rolePerms)
			.onConflictDoNothing({
				target: [rolePermissions.roleId, rolePermissions.permissionId],
			});
	}
}
