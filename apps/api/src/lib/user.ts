import { eq, inArray } from "drizzle-orm";
import { roles, userRoles, users } from "../db/schema";
import type { Database } from "../db";
import { getUserEffectivePermissions } from "./rbac/permissions";

export async function getUsers(db: Database) {
	const userList = await db
		.select({
			id: users.id,
			email: users.email,

			displayName: users.displayName,
			givenName: users.givenName,
			familyName: users.familyName,
			middleName: users.middleName,
			nickname: users.nickname,
			preferredUsername: users.preferredUsername,

			profileUrl: users.profileUrl,
			profileImageKey: users.profileImageKey,
			website: users.website,

			gender: users.gender,
			birthdate: users.birthdate,
			zoneinfo: users.zoneinfo,
			locale: users.locale,

			emailVerifiedAt: users.emailVerifiedAt,
			disabledAt: users.disabledAt,

			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(users);

	if (userList.length === 0) {
		return [];
	}

	const userIds = userList.map((u) => u.id);

	const allUserRoles = await db
		.select({
			userId: userRoles.userId,
			roleId: userRoles.roleId,
			roleName: roles.name,
		})
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(inArray(userRoles.userId, userIds));

	const userRolesMap = new Map<
		string,
		{ roleId: string; roleName: string }[]
	>();
	for (const ur of allUserRoles) {
		const existing = userRolesMap.get(ur.userId) ?? [];
		existing.push({ roleId: ur.roleId, roleName: ur.roleName });
		userRolesMap.set(ur.userId, existing);
	}

	return userList.map((u) => {
		const assigned = userRolesMap.get(u.id) ?? [];
		const roleIds = assigned.map((r) => r.roleId);
		const roleNames = assigned.map((r) => r.roleName);
		return {
			...u,
			roles: roleNames,
			roleIds,
		};
	});
}

/**
 * Checks whether a user account is currently disabled.
 *
 * An account is considered disabled only if `disabledAt` is set and has
 * already elapsed (`disabledAt <= Date.now()`). Future timestamps are treated
 * as scheduled and do not disable the account yet.
 *
 * @param user The user object with an optional `disabledAt` timestamp.
 * @returns `true` when the account is currently disabled; otherwise, `false`.
 */
export function isUserDisabled(
	user: { disabledAt?: number | null } | null | undefined,
): boolean {
	return user?.disabledAt != null && user.disabledAt <= Date.now();
}

export async function toAuthUser(db: Database, user: typeof users.$inferSelect) {
	const { roles, permissions } = await getUserEffectivePermissions(
		db,
		user.id,
	);

	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName,
		givenName: user.givenName,
		familyName: user.familyName,
		middleName: user.middleName,
		nickname: user.nickname,
		preferredUsername: user.preferredUsername,
		profileUrl: user.profileUrl,
		profileImageKey: user.profileImageKey,
		website: user.website,
		gender: user.gender,
		birthdate: user.birthdate,
		zoneinfo: user.zoneinfo,
		locale: user.locale,
		emailVerifiedAt: user.emailVerifiedAt,
		createdAt: user.createdAt,
		roles,
		permissions: Array.from(permissions),
	};
}
