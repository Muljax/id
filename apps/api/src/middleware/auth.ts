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

export type AuthMethod = "session" | "oauth";

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
		authMethod?: AuthMethod;
		tokenScopes?: Set<string>;
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
			c.set("authMethod", "session");
			return next();
		}
	}

	// OAuth 2.0 Bearer access token support (for CLI and API clients)
	const authHeader = c.req.header("Authorization");
	if (authHeader?.toLowerCase().startsWith("bearer ")) {
		const token = authHeader.slice(7).trim();
		const accessToken = await getAccessToken(db, token);

		if (accessToken) {
			if (accessToken.userId) {
				const result = await db
					.select()
					.from(users)
					.where(eq(users.id, accessToken.userId))
					.limit(1);

				const userRecord = result[0];
				if (userRecord && !isUserDisabled(userRecord)) {
					const userEffective = await getUserEffectivePermissions(
						db,
						userRecord.id,
					);

					const tokenScopesList = accessToken.scope.split(" ").filter(Boolean);
					const tokenScopesSet = new Set(tokenScopesList);

					// Scope attenuation:
					// An OAuth access token ONLY receives permissions that were explicitly granted
					// in its token scopes AND that the authorizing user actually possesses.
					const permissions = new Set<string>();
					for (const scope of tokenScopesList) {
						if (hasPermission(userEffective.permissions, scope)) {
							permissions.add(scope);
						}
					}

					// Always include universal "everyone" role permissions (public discovery)
					const everyonePerms = await getEveryoneRolePermissions(db);
					for (const perm of everyonePerms) {
						permissions.add(perm);
					}

					// Roles for OAuth token:
					// Only grant 'admin' role if authorizing user is admin AND the token has '*' scope.
					const roles: string[] = [SYSTEM_ROLE_IDS.EVERYONE];
					if (
						userEffective.roles.includes(SYSTEM_ROLE_IDS.ADMIN) &&
						tokenScopesSet.has("*")
					) {
						roles.push(SYSTEM_ROLE_IDS.ADMIN);
					}
					if (userEffective.roles.includes(SYSTEM_ROLE_IDS.USER)) {
						roles.push(SYSTEM_ROLE_IDS.USER);
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
						latitude: null,
						longitude: null,
						userAgent: null,
						browser: null,
						os: null,
						expiresAt: accessToken.expiresAt,
						createdAt: accessToken.createdAt,
						lastUsedAt: null,
						elevatedUntil: null,
					});
					c.set("roles", roles);
					c.set("permissions", permissions);
					c.set("authMethod", "oauth");
					c.set("tokenScopes", tokenScopesSet);
					return next();
				}
			} else {
				// M2M client credentials token
				const tokenScopesList = accessToken.scope.split(" ").filter(Boolean);
				const permissions = new Set(tokenScopesList);
				const everyonePerms = await getEveryoneRolePermissions(db);
				for (const perm of everyonePerms) {
					permissions.add(perm);
				}
				const roles = permissions.has("*")
					? [SYSTEM_ROLE_IDS.EVERYONE, SYSTEM_ROLE_IDS.ADMIN]
					: [SYSTEM_ROLE_IDS.EVERYONE];

				c.set("roles", roles);
				c.set("permissions", permissions);
				c.set("authMethod", "oauth");
				c.set("tokenScopes", new Set(tokenScopesList));
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
 * Ensures user is authenticated with a valid session or token.
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
 * Ensures user is authenticated with an interactive first-party session (cookie),
 * or an OAuth access token explicitly granted administrative write access ('users:write' or '*').
 * Protects account self-service management, profile updates, and avatar modification.
 */
export async function requireSessionAuth(c: Context<AppEnv>, next: Next) {
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

	const authMethod = c.get("authMethod");
	if (authMethod === "oauth") {
		const permissions = c.get("permissions") ?? new Set();
		if (
			!hasPermission(permissions, "users:write") &&
			!hasPermission(permissions, "*")
		) {
			return c.json(
				{
					error: "forbidden",
					message:
						"Account management requires an interactive user session or administrative write scope.",
				},
				403,
			);
		}
	}

	await next();
}

/**
 * Ensures user is authenticated STRICTLY via an interactive first-party session cookie.
 * Rejects third-party delegated OAuth bearer tokens regardless of granted scopes.
 * Protects high-consequence operations: password changes, passkeys, account deletion, and authorization approvals.
 */
export async function requireStrictSessionAuth(c: Context<AppEnv>, next: Next) {
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

	const authMethod = c.get("authMethod");
	if (authMethod !== "session") {
		return c.json(
			{
				error: "forbidden",
				message:
					"This sensitive operation requires an interactive user session.",
			},
			403,
		);
	}

	await next();
}

/**
 * Ensures the caller's session is currently elevated via a recent authentication challenge.
 * Returns 403 with code 'STEP_UP_REQUIRED' if the session is not elevated or the elevation window has expired.
 */
export async function requireElevatedSession(c: Context<AppEnv>, next: Next) {
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

	const authMethod = c.get("authMethod");
	if (authMethod === "oauth") {
		const permissions = c.get("permissions") ?? new Set();
		if (hasPermission(permissions, "*")) {
			return next();
		}
		return c.json(
			{
				error: "forbidden",
				code: "STEP_UP_REQUIRED",
				message:
					"This sensitive operation requires an elevated interactive session or admin wildcard token.",
			},
			403,
		);
	}

	const session = c.get("session");
	if (
		!session ||
		!session.elevatedUntil ||
		session.elevatedUntil < Date.now()
	) {
		return c.json(
			{
				error: "forbidden",
				code: "STEP_UP_REQUIRED",
				message:
					"Step-up re-authentication is required to perform this action.",
			},
			403,
		);
	}

	await next();
}

/**
 * Reusable middleware factory that permits access if the user is authenticated via
 * an interactive cookie session, OR via an OAuth token with at least one of the specified permissions.
 */
export function requireSessionOrPermission(...requiredPermissions: string[]) {
	return async (c: Context<AppEnv>, next: Next) => {
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

		const authMethod = c.get("authMethod");
		if (authMethod === "session") {
			return next();
		}

		const permissions = c.get("permissions") ?? new Set();
		const satisfied = requiredPermissions.some((p) =>
			hasPermission(permissions, p),
		);

		if (!satisfied) {
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
