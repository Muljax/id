import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "../db";
import { users } from "../db/schema";
import { getAccessToken } from "../lib/oauth/tokens";
import { SYSTEM_ROLE_IDS } from "../lib/rbac/constants";
import { hasPermission } from "../lib/rbac/matcher";
import {
	getEveryoneRolePermissions,
	getUserEffectivePermissions,
} from "../lib/rbac/permissions";
import { getSessionUserWithSession } from "../lib/session";
import { isUserDisabled } from "../lib/user";

export type AuthUser = NonNullable<
	Awaited<ReturnType<typeof getSessionUserWithSession>>
>["user"];

export type AuthSession = NonNullable<
	Awaited<ReturnType<typeof getSessionUserWithSession>>
>["session"];

export type AppEnv = {
	Bindings: Env;

	Variables: {
		user: AuthUser;
		session: AuthSession;
		roles: string[];
		permissions: Set<string>;
	};
};

/**
 * Pipeline middleware: Authenticates session and resolves user identity,
 * roles, and effective permissions in a single pass.
 * Unauthenticated callers receive the universal 'everyone' role and its read permissions.
 */
export async function authenticate(c: Context<AppEnv>, next: Next) {
	if (c.get("permissions")) {
		return next();
	}

	const sessionToken = getCookie(c, "session");
	const db = createDb(c.env.DB);

	if (sessionToken) {
		const record = await getSessionUserWithSession(db, sessionToken);

		if (record && !isUserDisabled(record.user)) {
			const { roles, permissions } = await getUserEffectivePermissions(
				db,
				record.user.id,
			);

			c.set("user", record.user);
			c.set("session", record.session);
			c.set("roles", roles);
			c.set("permissions", permissions);
			return next();
		}
	}

	// OAuth 2.0 Bearer access token support (for CLI and API clients)
	const authHeader = c.req.header("Authorization");
	if (authHeader?.toLowerCase().startsWith("bearer ")) {
		const token = authHeader.slice(7).trim();
		const accessToken = await getAccessToken(db, token);

		if (accessToken?.userId) {
			const result = await db
				.select()
				.from(users)
				.where(eq(users.id, accessToken.userId))
				.limit(1);

			const userRecord = result[0];
			if (userRecord && !isUserDisabled(userRecord)) {
				const { roles, permissions } = await getUserEffectivePermissions(
					db,
					userRecord.id,
				);

				const tokenScopes = accessToken.scope.split(" ").filter(Boolean);
				for (const scope of tokenScopes) {
					permissions.add(scope);
				}

				c.set("user", userRecord);
				c.set("session", {
					id: accessToken.id,
					userId: userRecord.id,
					tokenHash: accessToken.tokenHash,
					ipAddress: null,
					country: null,
					city: null,
					region: null,
					userAgent: null,
					browser: null,
					os: null,
					expiresAt: accessToken.expiresAt,
					createdAt: accessToken.createdAt,
					lastUsedAt: null,
				});
				c.set("roles", roles);
				c.set("permissions", permissions);
				return next();
			}
		}
	}

	// Unauthenticated caller: apply the universal "everyone" role & read permissions
	const everyonePerms = await getEveryoneRolePermissions(db);
	c.set("roles", [SYSTEM_ROLE_IDS.EVERYONE]);
	c.set("permissions", everyonePerms);

	await next();
}

/**
 * Ensures user is authenticated with a valid session.
 */
export async function requireAuth(c: Context<AppEnv>, next: Next) {
	if (!c.get("permissions")) {
		await authenticate(c, async () => {});
	}

	if (!c.get("user")) {
		return c.json(
			{
				error: "unauthorized",
			},
			401,
		);
	}

	await next();
}

/**
 * Reusable middleware factory for requiring all specified permissions.
 * Allows unauthenticated callers if their 'everyone' role satisfies all required permissions.
 */
export function requirePermission(...requiredPermissions: string[]) {
	return async (c: Context<AppEnv>, next: Next) => {
		if (!c.get("permissions")) {
			await authenticate(c, async () => {});
		}

		const permissions = c.get("permissions") ?? new Set();
		const satisfied = requiredPermissions.every((p) =>
			hasPermission(permissions, p),
		);

		if (!satisfied) {
			if (!c.get("user")) {
				return c.json(
					{
						error: "unauthorized",
					},
					401,
				);
			}
			return c.json(
				{
					error: "forbidden",
					message: "Insufficient permissions to perform this action.",
					required: requiredPermissions,
				},
				403,
			);
		}

		await next();
	};
}

/**
 * Reusable middleware factory for requiring at least one of the specified permissions.
 * Allows unauthenticated callers if their 'everyone' role satisfies any required permission.
 */
export function requireAnyPermission(...requiredPermissions: string[]) {
	return async (c: Context<AppEnv>, next: Next) => {
		if (!c.get("permissions")) {
			await authenticate(c, async () => {});
		}

		const permissions = c.get("permissions") ?? new Set();
		const satisfied = requiredPermissions.some((p) =>
			hasPermission(permissions, p),
		);

		if (!satisfied) {
			if (!c.get("user")) {
				return c.json(
					{
						error: "unauthorized",
					},
					401,
				);
			}
			return c.json(
				{
					error: "forbidden",
					message: "Insufficient permissions to perform this action.",
					required: requiredPermissions,
				},
				403,
			);
		}

		await next();
	};
}

/**
 * Guard that ensures the user has administrative privileges ('*' permission or 'admin' role).
 */
export async function requireAdmin(c: Context<AppEnv>, next: Next) {
	if (!c.get("permissions")) {
		await authenticate(c, async () => {});
	}

	if (!c.get("user")) {
		return c.json(
			{
				error: "unauthorized",
			},
			401,
		);
	}

	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();

	if (!roles.includes("admin") && !hasPermission(permissions, "*")) {
		return c.json(
			{
				error: "forbidden",
			},
			403,
		);
	}

	await next();
}
