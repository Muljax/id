import { and, eq, gt } from "drizzle-orm";

import type { Database } from "../db";
import { passwordResetTokens, users } from "../db/schema";
import { emitNotification } from "./notifications/emitter";
import { hashPassword } from "./password";
import { deleteAllSessions } from "./session";
import { generateToken, hashToken } from "./token";
import { isUserDisabled } from "./user";

const RESET_TOKEN_DURATION = 1000 * 60 * 60 * 24; // 24 hours

export interface PasswordResetTokenResult {
	token: string;
	expiresAt: number;
}

/**
 * Generates and stores a new password reset token for a user.
 * Invalidates any existing password reset tokens for the user.
 *
 * @param db The database connection.
 * @param userId The ID of the user requesting a reset.
 * @param ttlMs Optional time-to-live in milliseconds.
 * @returns The plaintext token and expiration timestamp.
 */
export async function createPasswordResetToken(
	db: Database,
	userId: string,
	ttlMs: number = RESET_TOKEN_DURATION,
): Promise<PasswordResetTokenResult> {
	// Purge existing tokens for this user
	await db
		.delete(passwordResetTokens)
		.where(eq(passwordResetTokens.userId, userId));

	const token = generateToken();
	const tokenHash = await hashToken(token);
	const now = Date.now();
	const expiresAt = now + ttlMs;

	await db.insert(passwordResetTokens).values({
		id: crypto.randomUUID(),
		userId,
		tokenHash,
		expiresAt,
		createdAt: now,
	});

	return {
		token,
		expiresAt,
	};
}

/**
 * Verifies that a password reset token exists and has not expired.
 *
 * @param db The database connection.
 * @param token The plaintext token to verify.
 * @returns The matching token record and user ID, or null if invalid or expired.
 */
export async function verifyPasswordResetToken(db: Database, token: string) {
	if (!token || typeof token !== "string") {
		return null;
	}

	const tokenHash = await hashToken(token);
	const now = Date.now();

	const records = await db
		.select({
			id: passwordResetTokens.id,
			userId: passwordResetTokens.userId,
			expiresAt: passwordResetTokens.expiresAt,
			createdAt: passwordResetTokens.createdAt,
			userEmail: users.email,
			userDisabledAt: users.disabledAt,
		})
		.from(passwordResetTokens)
		.innerJoin(users, eq(users.id, passwordResetTokens.userId))
		.where(
			and(
				eq(passwordResetTokens.tokenHash, tokenHash),
				gt(passwordResetTokens.expiresAt, now),
			),
		)
		.limit(1);

	const record = records[0];

	if (!record) {
		return null;
	}

	if (isUserDisabled({ disabledAt: record.userDisabledAt })) {
		return null;
	}

	return record;
}

/**
 * Consumes a password reset token to set a new password, invalidating all user sessions.
 *
 * @param db The database connection.
 * @param token The plaintext token.
 * @param newPassword The new plaintext password.
 * @returns `true` when successful; otherwise throws or returns `false`.
 */
export async function consumePasswordResetToken(
	db: Database,
	token: string,
	newPassword: string,
): Promise<{ success: boolean; userId: string; email: string }> {
	if (!token || typeof token !== "string") {
		throw new Error("Invalid or expired password reset token");
	}

	const tokenHash = await hashToken(token);
	const now = Date.now();

	// Atomically delete and claim the specific token to prevent replay/race conditions
	const deleted = await db
		.delete(passwordResetTokens)
		.where(
			and(
				eq(passwordResetTokens.tokenHash, tokenHash),
				gt(passwordResetTokens.expiresAt, now),
			),
		)
		.returning();

	const claimedToken = deleted[0];
	if (!claimedToken) {
		throw new Error("Invalid or expired password reset token");
	}

	// Verify user is valid and active
	const userRecords = await db
		.select({
			id: users.id,
			email: users.email,
			disabledAt: users.disabledAt,
		})
		.from(users)
		.where(eq(users.id, claimedToken.userId))
		.limit(1);

	const user = userRecords[0];
	if (!user || isUserDisabled(user)) {
		throw new Error("Invalid or expired password reset token");
	}

	const passwordHash = await hashPassword(newPassword);

	// Update user password
	await db
		.update(users)
		.set({
			passwordHash,
			updatedAt: now,
		})
		.where(eq(users.id, user.id));

	// Delete all other password reset tokens for this user
	await db
		.delete(passwordResetTokens)
		.where(eq(passwordResetTokens.userId, user.id));

	// Terminate all active sessions for security
	await deleteAllSessions(db, user.id);

	// Notify user
	await emitNotification(db, {
		userId: user.id,
		type: "security.password_reset_completed",
		category: "security",
		severity: "warning",
		title: "Password Reset Completed",
		message:
			"Your account password was successfully reset. All active sessions were revoked.",
		actionUrl: "/account/password",
	});

	// Notify admins for audit
	await emitNotification(db, {
		target: "admins",
		type: "admin.user_password_reset",
		category: "security",
		severity: "info",
		title: "User Password Reset",
		message: `Password reset was completed for user "${user.email}".`,
		actionUrl: `/admin/users?userId=${user.id}`,
	});

	return {
		success: true,
		userId: user.id,
		email: user.email,
	};
}

/**
 * Handles an unauthenticated request to reset a password.
 * Always returns gracefully to prevent account enumeration, emitting an admin notification
 * if the account exists and is active.
 *
 * @param db The database connection.
 * @param email The email address submitted.
 * @param metadata Request origin metadata (IP, user agent).
 */
export async function requestPasswordResetNotification(
	db: Database,
	email: string,
	metadata: { ipAddress?: string; userAgent?: string } = {},
) {
	const normalizedEmail = email.trim().toLowerCase();

	const matchingUsers = await db
		.select({
			id: users.id,
			email: users.email,
			displayName: users.displayName,
			disabledAt: users.disabledAt,
		})
		.from(users)
		.where(eq(users.email, normalizedEmail))
		.limit(1);

	const user = matchingUsers[0];

	if (user && !isUserDisabled(user)) {
		await emitNotification(db, {
			target: "admins",
			type: "admin.password_reset_requested",
			category: "security",
			severity: "warning",
			title: "Password Reset Requested",
			message: `User "${user.email}" requested a password reset. An administrator can generate a one-time reset link in User Directory.`,
			actionUrl: `/admin/users?userId=${user.id}`,
			data: {
				userId: user.id,
				email: user.email,
				ipAddress: metadata.ipAddress,
				userAgent: metadata.userAgent,
			},
		});
	}
}
