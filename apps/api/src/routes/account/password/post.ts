import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { hashPassword, verifyPassword } from "@/lib/password";
import { deleteOtherSessions } from "@/lib/session";
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

	const session = c.get("session");
	const db = createDb(c.env.DB);

	if (!user.passwordHash) {
		return c.json(
			{
				error: "Current password is incorrect",
			},
			400,
		);
	}

	const validPassword = await verifyPassword(
		currentPassword,
		user.passwordHash,
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

	await emitNotification(db, {
		userId: user.id,
		type: "security.password_changed",
		category: "security",
		severity: "warning",
		title: "Password Changed",
		message:
			"Your password was recently changed. All other active sessions were revoked.",
		actionUrl: "/account/password",
	});

	return c.json({
		success: true,
	});
});

export default route;
