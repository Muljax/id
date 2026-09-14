import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { deleteOtherSessions, getSession } from "@/lib/session";
import { requireAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.post("/", requireAuth, async (c) => {
	const user = c.get("user");

	const body = await c.req.json<{
		currentPassword?: string;
		newPassword?: string;
	}>();

	const currentPassword = body.currentPassword;
	const newPassword = body.newPassword;

	if (!currentPassword || !newPassword) {
		return c.json(
			{
				error: "Current password and new password are required",
			},
			400,
		);
	}

	if (newPassword.length < 8 || newPassword.length > 128) {
		return c.json(
			{
				error: "New password must be between 8 and 128 characters",
			},
			400,
		);
	}

	if (currentPassword.length > 128) {
		return c.json(
			{
				error: "Current password is incorrect",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);

	const sessionToken = getCookie(c, "session");

	if (!sessionToken) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const session = await getSession(db, sessionToken);

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const result = await db
		.select({
			id: users.id,
			passwordHash: users.passwordHash,
		})
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);

	const account = result[0];

	if (!account) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const validPassword = await verifyPassword(
		currentPassword,
		account.passwordHash,
	);

	if (!validPassword) {
		return c.json(
			{
				error: "Current password is incorrect",
			},
			400,
		);
	}

	const passwordHash = await hashPassword(newPassword);

	await db
		.update(users)
		.set({
			passwordHash,
			updatedAt: Date.now(),
		})
		.where(eq(users.id, user.id));

	await deleteOtherSessions(db, user.id, session.id);

	return c.json({
		success: true,
	});
});

export default route;
