import * as schema from "../../src/db/schema";
import { SYSTEM_ROLE_IDS } from "../../src/lib/rbac/constants";
import { createOAuthClient } from "../../src/lib/oauth/client";
import { createSession } from "../../src/lib/session";
import { hashPassword } from "../../src/lib/password";
import { hashToken } from "../../src/lib/token";

export interface CreateTestUserOptions {
	id?: string;
	email?: string;
	password?: string;
	displayName?: string;
	disabledAt?: number | null;
	roleIds?: string[];
}

/**
 * Creates a standard test user in the database.
 */
export async function createTestUser(
	db: import("../../src/db").Database,
	options: CreateTestUserOptions = {},
) {
	const now = Date.now();
	const id = options.id || `user-${crypto.randomUUID()}`;
	const email = options.email || `${id}@example.com`;
	const password = options.password || "Password123!";
	const passwordHash = await hashPassword(password);

	await db.insert(schema.users).values({
		id,
		email,
		passwordHash,
		displayName: options.displayName || "Test User",
		disabledAt: options.disabledAt ?? null,
		createdAt: now,
		updatedAt: now,
	});

	if (options.roleIds && options.roleIds.length > 0) {
		await db.insert(schema.userRoles).values(
			options.roleIds.map((roleId) => ({
				userId: id,
				roleId,
				assignedAt: now,
			})),
		);
	}

	return {
		id,
		email,
		password,
		passwordHash,
	};
}

/**
 * Creates a test user with Administrator privileges.
 */
export async function createTestAdminUser(
	db: import("../../src/db").Database,
	options: CreateTestUserOptions = {},
) {
	const adminRoleId = SYSTEM_ROLE_IDS.ADMIN;

	// Ensure admin role exists
	await db
		.insert(schema.roles)
		.values({
			id: adminRoleId,
			name: "Administrator",
			isSystem: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		})
		.onConflictDoNothing();

	return createTestUser(db, {
		...options,
		roleIds: [...(options.roleIds || []), adminRoleId],
	});
}

export interface CreateTestOAuthClientOptions {
	id?: string;
	name?: string;
	clientType?: "public" | "confidential";
	clientSecret?: string;
	redirectUris?: string[];
	scopes?: string[];
}

/**
 * Creates a test OAuth client in the database.
 */
export async function createTestOAuthClient(
	db: import("../../src/db").Database,
	options: CreateTestOAuthClientOptions = {},
) {
	const now = Date.now();
	const id = options.id || crypto.randomUUID();
	const clientType = options.clientType || "public";
	const clientSecret =
		options.clientSecret ||
		(clientType === "confidential" ? "secret-123" : undefined);
	const clientSecretHash = clientSecret
		? await hashToken(clientSecret)
		: undefined;

	await db.insert(schema.oauthClients).values({
		id,
		name: options.name || "Test Client",
		clientType,
		clientSecretHash,
		redirectUris: JSON.stringify(
			options.redirectUris || ["https://app.example.com/callback"],
		),
		scopes: JSON.stringify(options.scopes || ["openid", "profile", "email"]),
		createdAt: now,
		updatedAt: now,
	});

	return {
		client: {
			id,
			name: options.name || "Test Client",
			clientType,
			clientSecretHash,
			redirectUris: options.redirectUris || [
				"https://app.example.com/callback",
			],
			scopes: options.scopes || ["openid", "profile", "email"],
			createdAt: now,
			updatedAt: now,
		},
		clientSecret,
	};
}

export { createSession as createTestSession };
