import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "../db";
import { hasPermission } from "../lib/rbac/matcher";
import { getUserEffectivePermissions } from "../lib/rbac/permissions";
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
 */
export async function authenticate(c: Context<AppEnv>, next: Next) {
	if (c.get("user")) {
		return next();
	}

	const sessionToken = getCookie(c, "session");

	if (sessionToken) {
		const db = createDb(c.env.DB);
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
		}
	}

	await next();
}

/**
 * Ensures user is authenticated.
 */
export async function requireAuth(c: Context<AppEnv>, next: Next) {
	if (!c.get("user")) {
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
 */
export function requirePermission(...requiredPermissions: string[]) {
	return async (c: Context<AppEnv>, next: Next) => {
		if (!c.get("user")) {
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

		const permissions = c.get("permissions") ?? new Set();
		const satisfied = requiredPermissions.every((p) =>
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
 * Reusable middleware factory for requiring at least one of the specified permissions.
 */
export function requireAnyPermission(...requiredPermissions: string[]) {
	return async (c: Context<AppEnv>, next: Next) => {
		if (!c.get("user")) {
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
 * Guard that ensures the user has administrative privileges ('*' permission or 'admin' role).
 */
export async function requireAdmin(c: Context<AppEnv>, next: Next) {
	if (!c.get("user")) {
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
