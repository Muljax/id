import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
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
import { AuthUserResponseSchema, LoginRequestSchema } from "@/schemas/auth";
import { ErrorResponseSchema } from "@/schemas/common";

interface CloudflareRequestProperties {
	country?: string;
	city?: string;
	region?: string;
	latitude?: string | number;
	longitude?: string | number;
}

export const loginRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Authentication"],
	summary: "User login",
	description:
		"Authenticate a user with email and password. Sets session cookie on success.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: LoginRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AuthUserResponseSchema,
				},
			},
			description: "Authentication successful",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid request parameters",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid credentials or unauthorized",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Authentication mode disabled or account suspended",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	loginRoute,
	async (c) => {
		const {
			email,
			password,
			adminKey,
			rememberMe = false,
			prompt,
		} = c.req.valid("json");

		const forceReauthentication = prompt === "login";

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
			.where(eq(users.email, email.trim().toLowerCase()))
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

				const keyResult = await verifySigninKey(db, adminKey.trim());
				if (!keyResult.valid) {
					return c.json(
						{
							error:
								keyResult.error ||
								"Invalid or expired administrator access key.",
						},
						401,
					);
				}
			} else if (adminKey) {
				// If admin provided a key, still verify and track usage
				await verifySigninKey(db, adminKey.trim());
			}
		}

		const existingToken = getCookie(c, "session");

		if (!forceReauthentication && existingToken) {
			const existingSession = await getSession(db, existingToken);

			if (existingSession && existingSession.userId === user.id) {
				return c.json(
					{
						user: await toAuthUser(db, user),
					},
					200,
				);
			}
		}

		if (forceReauthentication && existingToken) {
			await deleteSession(db, existingToken);
		}

		const cf = c.req.raw.cf as CloudflareRequestProperties | undefined;
		const rawLat = cf?.latitude ?? c.req.header("CF-IPLatitude");
		const rawLon = cf?.longitude ?? c.req.header("CF-IPLongitude");

		const session = await createSession(
			db,
			user.id,
			{
				ipAddress: c.req.header("CF-Connecting-IP"),
				country: cf?.country,
				city: cf?.city,
				region: cf?.region,
				latitude: rawLat != null && rawLat !== "" ? Number(rawLat) : undefined,
				longitude: rawLon != null && rawLon !== "" ? Number(rawLon) : undefined,
				userAgent: c.req.header("User-Agent"),
			},
			rememberMe,
		);

		setSessionCookie(c, session.token);

		return c.json(
			{
				user: await toAuthUser(db, user),
			},
			200,
		);
	},
);

export default route;
