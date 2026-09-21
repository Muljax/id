import { lte } from "drizzle-orm";

import type { Database } from "../db";
import {
	oauthAuthorizationCodes,
	oauthDeviceCodes,
	passkeyChallenges,
	passwordResetTokens,
	sessions,
	sshCertificates,
} from "../db/schema";

/**
 * Result counts from an expired data cleanup run.
 */
export interface CleanupResult {
	sessions: number;
	passkeyChallenges: number;
	passwordResetTokens: number;
	oauthAuthorizationCodes: number;
	oauthDeviceCodes: number;
	sshCertificates: number;
}

/**
 * Deletes all expired SSH certificates from the database, regardless of whether
 * they are revoked or unrevoked (`validBefore <= Math.floor(Date.now() / 1000)`).
 *
 * OpenSSH automatically rejects expired certificates against the system clock,
 * so retaining expired certificates in the database or KRL is unnecessary.
 *
 * @param db The database connection.
 * @returns Number of deleted expired certificates.
 */
export async function cleanupExpiredCertificates(
	db: Database,
): Promise<number> {
	const nowSeconds = Math.floor(Date.now() / 1000);
	const result = (await db
		.delete(sshCertificates)
		.where(lte(sshCertificates.validBefore, nowSeconds))) as unknown as {
		meta?: { changes: number };
		changes?: number;
	};
	return result.meta?.changes ?? result.changes ?? 0;
}

/**
 * Deletes all expired sessions, passkey challenges, password reset tokens,
 * OAuth authorization codes, device codes, and SSH certificates from the database in parallel.
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
	const nowSeconds = Math.floor(now / 1000);

	const [
		deletedSessions,
		deletedChallenges,
		deletedResetTokens,
		deletedAuthCodes,
		deletedDeviceCodes,
		deletedCertificates,
	] = (await Promise.all([
		db.delete(sessions).where(lte(sessions.expiresAt, now)),
		db.delete(passkeyChallenges).where(lte(passkeyChallenges.expiresAt, now)),
		db
			.delete(passwordResetTokens)
			.where(lte(passwordResetTokens.expiresAt, now)),
		db
			.delete(oauthAuthorizationCodes)
			.where(lte(oauthAuthorizationCodes.expiresAt, now)),
		db.delete(oauthDeviceCodes).where(lte(oauthDeviceCodes.expiresAt, now)),
		db
			.delete(sshCertificates)
			.where(lte(sshCertificates.validBefore, nowSeconds)),
	])) as unknown as Array<{ meta?: { changes: number }; changes?: number }>;

	return {
		sessions: deletedSessions.meta?.changes ?? deletedSessions.changes ?? 0,
		passkeyChallenges:
			deletedChallenges.meta?.changes ?? deletedChallenges.changes ?? 0,
		passwordResetTokens:
			deletedResetTokens.meta?.changes ?? deletedResetTokens.changes ?? 0,
		oauthAuthorizationCodes:
			deletedAuthCodes.meta?.changes ?? deletedAuthCodes.changes ?? 0,
		oauthDeviceCodes:
			deletedDeviceCodes.meta?.changes ?? deletedDeviceCodes.changes ?? 0,
		sshCertificates:
			deletedCertificates.meta?.changes ?? deletedCertificates.changes ?? 0,
	};
}
