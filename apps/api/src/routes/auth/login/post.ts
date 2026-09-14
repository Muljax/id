import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { setSessionCookie } from "@/lib/cookie";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/password";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { isUserDisabled } from "@/lib/user";

interface CloudflareRequestProperties {
	country?: string;
	city?: string;
	region?: string;
}

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
	const body = await c.req.json<{
		email?: string;
		password?: string;
		rememberMe?: boolean;
		prompt?: string;
	}>();

	const email = body.email?.trim().toLowerCase();
	const password = body.password;
	const rememberMe = body.rememberMe ?? false;
	const forceReauthentication = body.prompt === "login";

	if (!email || !password) {
		return c.json(
			{
				error: "Email and password are required",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);

	const result = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	const user = result[0];

	// Mitigate timing-based user enumeration by always running Argon2id verification
	const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
	const validPassword = await verifyPassword(password, passwordHash);

	if (!user || !validPassword) {
		return c.json(
			{
				error: "Invalid email or password",
			},
			401,
		);
	}

	if (isUserDisabled(user)) {
		return c.json(
			{
				error: "Your account has been disabled.",
			},
			403,
		);
	}

	const existingToken = getCookie(c, "session");

	if (!forceReauthentication && existingToken) {
		const existingSession = await getSession(db, existingToken);

		if (existingSession && existingSession.userId === user.id) {
			return c.json({
				user: {
					id: user.id,
					email: user.email,
				},
			});
		}
	}

	if (forceReauthentication && existingToken) {
		await deleteSession(db, existingToken);
	}

	const cf = c.req.raw.cf as CloudflareRequestProperties | undefined;

	const session = await createSession(
		db,
		user.id,
		{
			ipAddress: c.req.header("CF-Connecting-IP"),
			country: cf?.country,
			city: cf?.city,
			region: cf?.region,
			userAgent: c.req.header("User-Agent"),
		},
		rememberMe,
	);

	setSessionCookie(c, session.token);

	return c.json({
		user: {
			id: user.id,
			email: user.email,
		},
	});
});

export default route;
