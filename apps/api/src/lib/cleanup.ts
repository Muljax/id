import { lte } from "drizzle-orm";

import type { Database } from "../db";
import {
	oauthAuthorizationCodes,
	passkeyChallenges,
	passwordResetTokens,
	sessions,
} from "../db/schema";

/**
 * Result counts from an expired auth data cleanup run.
 */
export interface CleanupResult {
	sessions: number;
	passkeyChallenges: number;
	passwordResetTokens: number;
	oauthAuthorizationCodes: number;
}

/**
 * Deletes all expired sessions, passkey challenges, password reset tokens,
 * and OAuth authorization codes from the database in parallel.
 *
 * Designed to be executed periodically by a Cloudflare Cron Trigger or background worker.
 *
 * @param db The database connection.
 * @returns Breakdown of deleted expired records by category.
 */
export async function cleanupExpiredAuthData(
	db: Database,
): Promise<CleanupResult> {
	const now = Date.now();

	const [
		deletedSessions,
		deletedChallenges,
		deletedResetTokens,
		deletedAuthCodes,
	] = await Promise.all([
		db.delete(sessions).where(lte(sessions.expiresAt, now)),
		db.delete(passkeyChallenges).where(lte(passkeyChallenges.expiresAt, now)),
		db
			.delete(passwordResetTokens)
			.where(lte(passwordResetTokens.expiresAt, now)),
		db
			.delete(oauthAuthorizationCodes)
			.where(lte(oauthAuthorizationCodes.expiresAt, now)),
	]);

	return {
		sessions: deletedSessions.meta.changes,
		passkeyChallenges: deletedChallenges.meta.changes,
		passwordResetTokens: deletedResetTokens.meta.changes,
		oauthAuthorizationCodes: deletedAuthCodes.meta.changes,
	};
}
