import { eq } from "drizzle-orm";
import { Hono } from "hono";

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
		inviteToken?: string;
	}>();

	const email = body.email?.trim().toLowerCase();
	const password = body.password;
	const inviteToken = body.inviteToken?.trim();

	if (!email || !password) {
		return c.json(
			{
				error: "Email and password are required.",
			},
			400,
		);
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return c.json(
			{
				error: "Invalid email format.",
			},
			400,
		);
	}

	if (password.length < 8) {
		return c.json(
			{
				error: "Password must be at least 8 characters long.",
			},
			400,
		);
	}

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

		const verifyResult = await verifyInviteToken(db, inviteToken, email);
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
		// If mode is enabled but user provided an invite token, validate it
		const verifyResult = await verifyInviteToken(db, inviteToken, email);
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
		const consumed = await consumeInviteToken(db, inviteToken, userId);
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

	const session = await createSession(
		db,
		userId,
		{
			ipAddress: c.req.header("CF-Connecting-IP"),
			country: cf?.country,
			city: cf?.city,
			region: cf?.region,
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
});

export default route;
