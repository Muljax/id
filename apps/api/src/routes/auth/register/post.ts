import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { type InviteToken, userRoles, users } from "@/db/schema";
import { setSessionCookie } from "@/lib/cookie";
import { consumeInviteToken, verifyInviteToken } from "@/lib/invites";
import { emitNotification } from "@/lib/notifications/emitter";
import { hashPassword } from "@/lib/password";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { getUserPermissions } from "@/lib/rbac/permissions";
import { createSession } from "@/lib/session";
import { getOrCreateInstanceSettings } from "@/lib/settings";
import { AuthUserResponseSchema, RegisterRequestSchema } from "@/schemas/auth";
import { ErrorResponseSchema } from "@/schemas/common";

interface CloudflareRequestProperties {
	country?: string;
	city?: string;
	region?: string;
	latitude?: string | number;
	longitude?: string | number;
}

export const registerRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Authentication"],
	summary: "User registration",
	description: "Register a new user account with email and password.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: RegisterRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: AuthUserResponseSchema,
				},
			},
			description: "User registered and session created",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Validation error or invalid invite token",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Registration mode disabled",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Email already registered",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	registerRoute,
	async (c) => {
		const { email: rawEmail, password, inviteToken } = c.req.valid("json");
		const email = rawEmail.trim().toLowerCase();

		const db = createDb(c.env.DB);
		const settings = await getOrCreateInstanceSettings(db);

		if (settings.signupMode === "disabled") {
			return c.json(
				{
					error: "Registration is currently disabled on this instance.",
				},
				403,
			);
		}

		let validInvite: InviteToken | undefined;

		if (settings.signupMode === "invite") {
			if (!inviteToken) {
				return c.json(
					{
						error: "An invitation token is required to register.",
					},
					400,
				);
			}

			const verifyResult = await verifyInviteToken(
				db,
				inviteToken.trim(),
				email,
			);
			if (!verifyResult.valid || !verifyResult.invite) {
				return c.json(
					{
						error: verifyResult.error || "Invalid or expired invitation token.",
					},
					400,
				);
			}
			validInvite = verifyResult.invite;
		} else if (inviteToken) {
			const verifyResult = await verifyInviteToken(
				db,
				inviteToken.trim(),
				email,
			);
			if (!verifyResult.valid || !verifyResult.invite) {
				return c.json(
					{
						error: verifyResult.error || "Invalid or expired invitation token.",
					},
					400,
				);
			}
			validInvite = verifyResult.invite;
		}

		const existing = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existing.length > 0) {
			return c.json(
				{
					error: "An account with this email already exists.",
				},
				409,
			);
		}

		const now = Date.now();
		const userId = crypto.randomUUID();
		const passwordHash = await hashPassword(password);
		const targetRoleId = validInvite?.roleId || SYSTEM_ROLE_IDS.USER;

		await db.insert(users).values({
			id: userId,
			email,
			passwordHash,
			createdAt: now,
			updatedAt: now,
		});

		await db
			.insert(userRoles)
			.values({
				userId,
				roleId: targetRoleId,
				assignedAt: now,
			})
			.onConflictDoNothing();

		if (validInvite && inviteToken) {
			const consumed = await consumeInviteToken(db, inviteToken.trim(), userId);
			if (!consumed) {
				await db.delete(users).where(eq(users.id, userId));
				return c.json(
					{
						error: "Invitation token has already been used or has expired.",
					},
					400,
				);
			}
		}

		await emitNotification(db, {
			userId,
			type: "auth.welcome",
			category: "auth",
			severity: "success",
			title: "Welcome to Muljax ID",
			message: "Your account has been created successfully.",
		});

		await emitNotification(db, {
			target: "admins",
			type: "admin.user_registered",
			category: "admin",
			severity: "info",
			title: "New User Registered",
			message: `${email} has registered an account${
				validInvite ? " using an invitation" : ""
			}.`,
			actionUrl: "/admin/users",
		});

		const cf = c.req.raw.cf as CloudflareRequestProperties | undefined;
		const rawLat = cf?.latitude ?? c.req.header("CF-IPLatitude");
		const rawLon = cf?.longitude ?? c.req.header("CF-IPLongitude");

		const session = await createSession(
			db,
			userId,
			{
				ipAddress: c.req.header("CF-Connecting-IP"),
				country: cf?.country,
				city: cf?.city,
				region: cf?.region,
				latitude: rawLat != null && rawLat !== "" ? Number(rawLat) : undefined,
				longitude: rawLon != null && rawLon !== "" ? Number(rawLon) : undefined,
				userAgent: c.req.header("User-Agent"),
			},
			true,
		);

		setSessionCookie(c, session.token);

		const userPerms = await getUserPermissions(db, userId);

		return c.json(
			{
				user: {
					id: userId,
					email,
					displayName: null,
					givenName: null,
					familyName: null,
					middleName: null,
					nickname: null,
					preferredUsername: null,
					profileUrl: null,
					profileImageKey: null,
					website: null,
					gender: null,
					birthdate: null,
					zoneinfo: null,
					locale: null,
					emailVerifiedAt: null,
					createdAt: now,
					roles: [targetRoleId],
					permissions: Array.from(userPerms),
				},
			},
			201,
		);
	},
);

export default route;
