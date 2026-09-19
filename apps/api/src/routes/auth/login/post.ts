import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { setSessionCookie } from "@/lib/cookie";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/password";
import { isUserAdmin } from "@/lib/rbac/permissions";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { getOrCreateInstanceSettings } from "@/lib/settings";
import { verifySigninKey } from "@/lib/signinKeys";
import { isUserDisabled, toAuthUser } from "@/lib/user";

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
		adminKey?: string;
		rememberMe?: boolean;
		prompt?: string;
	}>();

	const email = body.email?.trim().toLowerCase();
	const password = body.password;
	const adminKey = body.adminKey?.trim();
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
	const settings = await getOrCreateInstanceSettings(db);

	if (settings.signinMode === "disabled") {
		return c.json(
			{
				error: "Authentication is currently disabled on this instance.",
			},
			403,
		);
	}

	const result = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	const user = result[0];

	// Mitigate timing-based user enumeration by always running Argon2id verification
	const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;

	if (password.length > 128) {
		return c.json(
			{
				error: "Invalid email or password",
			},
			401,
		);
	}

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

	// Verify admin sign-in key if mode is admin_key
	if (settings.signinMode === "admin_key") {
		const isAdmin = await isUserAdmin(db, user.id);

		if (!isAdmin) {
			if (!adminKey) {
				return c.json(
					{
						error: "An administrator access key is required to sign in.",
					},
					403,
				);
			}

			const keyResult = await verifySigninKey(db, adminKey);
			if (!keyResult.valid) {
				return c.json(
					{
						error:
							keyResult.error || "Invalid or expired administrator access key.",
					},
					401,
				);
			}
		} else if (adminKey) {
			// If admin provided a key, still verify and track usage
			await verifySigninKey(db, adminKey);
		}
	}

	const existingToken = getCookie(c, "session");

	if (!forceReauthentication && existingToken) {
		const existingSession = await getSession(db, existingToken);

		if (existingSession && existingSession.userId === user.id) {
			return c.json({
				user: await toAuthUser(db, user),
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
		user: await toAuthUser(db, user),
	});
});

export default route;
