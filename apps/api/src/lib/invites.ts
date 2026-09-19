import { and, desc, eq, gt, isNull } from "drizzle-orm";

import type { Database } from "@/db";
import { type InviteToken, inviteTokens, users } from "@/db/schema";
import { generateToken, hashToken } from "./token";

const DEFAULT_INVITE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface CreateInviteOptions {
	email?: string | null;
	roleId?: string;
	createdByUserId?: string | null;
	ttlHours?: number;
}

export interface CreateInviteResult {
	id: string;
	token: string;
	email: string | null;
	roleId: string;
	expiresAt: number;
	createdAt: number;
}

export interface VerifyInviteResult {
	valid: boolean;
	error?: string;
	invite?: InviteToken;
}

/**
 * Creates and stores a new invitation token.
 */
export async function createInviteToken(
	db: Database,
	options: CreateInviteOptions = {},
): Promise<CreateInviteResult> {
	const token = generateToken();
	const tokenHash = await hashToken(token);
	const now = Date.now();
	const ttlMs = options.ttlHours
		? options.ttlHours * 60 * 60 * 1000
		: DEFAULT_INVITE_TTL;
	const expiresAt = now + ttlMs;
	const id = crypto.randomUUID();
	const normalizedEmail = options.email?.trim().toLowerCase() || null;
	const roleId = options.roleId || "user";

	await db.insert(inviteTokens).values({
		id,
		email: normalizedEmail,
		tokenHash,
		roleId,
		createdByUserId: options.createdByUserId || null,
		expiresAt,
		createdAt: now,
	});

	return {
		id,
		token,
		email: normalizedEmail,
		roleId,
		expiresAt,
		createdAt: now,
	};
}

/**
 * Verifies that an invite token is valid, unexpired, and not yet consumed.
 */
export async function verifyInviteToken(
	db: Database,
	token: string,
	targetEmail?: string,
): Promise<VerifyInviteResult> {
	if (!token || typeof token !== "string") {
		return { valid: false, error: "Invitation token is required." };
	}

	const tokenHash = await hashToken(token.trim());
	const now = Date.now();

	const rows = await db
		.select()
		.from(inviteTokens)
		.where(
			and(
				eq(inviteTokens.tokenHash, tokenHash),
				gt(inviteTokens.expiresAt, now),
				isNull(inviteTokens.usedAt),
			),
		)
		.limit(1);

	const invite = rows[0];

	if (!invite) {
		return { valid: false, error: "Invalid or expired invitation token." };
	}

	if (invite.email && targetEmail) {
		const normalizedTarget = targetEmail.trim().toLowerCase();
		if (invite.email.toLowerCase() !== normalizedTarget) {
			return {
				valid: false,
				error: "This invitation was not issued for you.",
			};
		}
	}

	return {
		valid: true,
		invite,
	};
}

/**
 * Marks an invite token as consumed by a newly registered user.
 */
export async function consumeInviteToken(
	db: Database,
	token: string,
	userId: string,
): Promise<boolean> {
	const tokenHash = await hashToken(token.trim());
	const now = Date.now();

	await db
		.update(inviteTokens)
		.set({
			usedAt: now,
			usedByUserId: userId,
		})
		.where(
			and(eq(inviteTokens.tokenHash, tokenHash), isNull(inviteTokens.usedAt)),
		);

	return true;
}

export interface AdminInviteItem extends InviteToken {
	creatorEmail?: string | null;
	usedByUserEmail?: string | null;
}

/**
 * Lists invitation tokens for administrator auditing.
 */
export async function listInviteTokens(
	db: Database,
): Promise<AdminInviteItem[]> {
	const rows = await db
		.select({
			id: inviteTokens.id,
			email: inviteTokens.email,
			tokenHash: inviteTokens.tokenHash,
			roleId: inviteTokens.roleId,
			createdByUserId: inviteTokens.createdByUserId,
			usedByUserId: inviteTokens.usedByUserId,
			expiresAt: inviteTokens.expiresAt,
			usedAt: inviteTokens.usedAt,
			createdAt: inviteTokens.createdAt,
			creatorEmail: users.email,
		})
		.from(inviteTokens)
		.leftJoin(users, eq(inviteTokens.createdByUserId, users.id))
		.orderBy(desc(inviteTokens.createdAt))
		.limit(100);

	return rows;
}

/**
 * Revokes / deletes an invite token.
 */
export async function revokeInviteToken(
	db: Database,
	id: string,
): Promise<boolean> {
	await db.delete(inviteTokens).where(eq(inviteTokens.id, id));
	return true;
}
