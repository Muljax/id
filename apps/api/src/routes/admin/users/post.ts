import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { roles, userRoles, users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { hashPassword } from "@/lib/password";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { generateToken } from "@/lib/token";
import { toAuthUser } from "@/lib/user";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post("/", requirePermission("users:write"), async (c) => {
	const body = await c.req
		.json<{
			email?: string;
			password?: string;
			roleId?: string;
		}>()
		.catch(() => null);

	const email = body?.email?.trim().toLowerCase();
	let password = body?.password;
	const roleId = body?.roleId?.trim() || SYSTEM_ROLE_IDS.USER;

	if (!email) {
		return c.json({ error: "Email is required." }, 400);
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return c.json({ error: "Invalid email format." }, 400);
	}

	let generatedPassword = false;
	if (!password) {
		// Generate random secure temporary password
		password = generateToken().slice(0, 16);
		generatedPassword = true;
	} else if (password.length < 8) {
		return c.json(
			{ error: "Password must be at least 8 characters long." },
			400,
		);
	}

	const db = createDb(c.env.DB);

	const existing = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (existing.length > 0) {
		return c.json({ error: "An account with this email already exists." }, 409);
	}

	const roleRecord = await db
		.select({ id: roles.id })
		.from(roles)
		.where(eq(roles.id, roleId))
		.limit(1);

	if (roleRecord.length === 0) {
		return c.json({ error: `Role '${roleId}' does not exist.` }, 400);
	}

	const now = Date.now();
	const userId = crypto.randomUUID();
	const passwordHash = await hashPassword(password);
	const adminUser = c.get("user");

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
			roleId,
			assignedAt: now,
			assignedBy: adminUser?.id,
		})
		.onConflictDoNothing();

	await emitNotification(db, {
		target: "admins",
		type: "admin.user_created",
		category: "admin",
		severity: "info",
		title: "User Created",
		message: `Admin ${adminUser?.email} created new user "${email}".`,
		actionUrl: `/admin/users?userId=${userId}`,
	});

	const [createdUser] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	const authUser = await toAuthUser(db, createdUser);

	return c.json(
		{
			user: authUser,
			temporaryPassword: generatedPassword ? password : null,
		},
		201,
	);
});

export default route;
