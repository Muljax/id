import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "../../../db";
import {
	oauthAccessTokens,
	oauthGrants,
	oauthRefreshTokens,
	sessions,
	sshCertificates,
	users,
} from "../../../db/schema";

/**
 * Disables a user by setting their disabled timestamp and
 * revoking all active sessions, OAuth tokens, grants, and SSH certificates.
 *
 * @param db The database connection.
 * @param userId The ID of the user to disable.
 */
export async function disableUser(db: Database, userId: string) {
	const now = Date.now();

	await db
		.update(users)
		.set({
			disabledAt: now,
			updatedAt: now,
		})
		.where(eq(users.id, userId));

	await db.delete(sessions).where(eq(sessions.userId, userId));

	await db
		.update(oauthAccessTokens)
		.set({ revokedAt: now })
		.where(
			and(
				eq(oauthAccessTokens.userId, userId),
				isNull(oauthAccessTokens.revokedAt),
			),
		);

	await db
		.update(oauthRefreshTokens)
		.set({ revokedAt: now })
		.where(
			and(
				eq(oauthRefreshTokens.userId, userId),
				isNull(oauthRefreshTokens.revokedAt),
			),
		);

	await db
		.update(oauthGrants)
		.set({ revokedAt: now })
		.where(and(eq(oauthGrants.userId, userId), isNull(oauthGrants.revokedAt)));

	await db
		.update(sshCertificates)
		.set({
			revokedAt: now,
			revokedReason: "User account deactivated via lifecycle",
		})
		.where(
			and(
				eq(sshCertificates.userId, userId),
				isNull(sshCertificates.revokedAt),
			),
		);
}
