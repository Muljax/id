import { getCookie } from "hono/cookie";
import type { Context, Next } from "hono";

import { createDb } from "../db";
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
	};
};

export async function requireAuth(c: Context<AppEnv>, next: Next) {
	const sessionToken = getCookie(c, "session");

	if (!sessionToken) {
		return c.json(
			{
				error: "unauthorized",
			},
			401,
		);
	}

	const db = createDb(c.env.DB);

	const record = await getSessionUserWithSession(db, sessionToken);

	if (!record) {
		return c.json(
			{
				error: "unauthorized",
			},
			401,
		);
	}

	if (isUserDisabled(record.user)) {
		return c.json(
			{
				error: "account_disabled",
			},
			403,
		);
	}

	c.set("user", record.user);
	c.set("session", record.session);

	await next();
}

export async function requireAdmin(c: Context<AppEnv>, next: Next) {
	const sessionToken = getCookie(c, "session");

	if (!sessionToken) {
		return c.json(
			{
				error: "unauthorized",
			},
			401,
		);
	}

	const db = createDb(c.env.DB);

	const record = await getSessionUserWithSession(db, sessionToken);

	if (!record?.user.isAdmin || isUserDisabled(record.user)) {
		return c.json(
			{
				error: "forbidden",
			},
			403,
		);
	}

	c.set("user", record.user);
	c.set("session", record.session);

	await next();
}
