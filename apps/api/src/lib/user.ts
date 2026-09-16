import { users } from "../db/schema";
import type { Database } from "../db";

export async function getUsers(db: Database) {
	return db
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
			isAdmin: users.isAdmin,
			disabledAt: users.disabledAt,

			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(users);
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

export function toAuthUser(user: typeof users.$inferSelect) {
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
		isAdmin: user.isAdmin,
	};
}
