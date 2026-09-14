import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { getDashboardOrigin } from "@/lib/env";
import { emitNotification } from "@/lib/notifications/emitter";
import { createPasswordResetToken } from "@/lib/password-reset";
import { requireAdmin } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.post("/", requireAdmin, async (c) => {
	const userId = c.req.param("userId");

	if (!userId) {
		return c.json(
			{
				error: "User ID is required",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);

	const targetUsers = await db
		.select({
			id: users.id,
			email: users.email,
			displayName: users.displayName,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	const targetUser = targetUsers[0];

	if (!targetUser) {
		return c.json(
			{
				error: "User not found",
			},
			404,
		);
	}

	const { token, expiresAt } = await createPasswordResetToken(db, userId);
	const origin = getDashboardOrigin(c.env);
	const resetUrl = `${origin}/reset-password?token=${token}`;

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.password_reset_link_generated",
		category: "security",
		severity: "info",
		title: "Password Reset Link Generated",
		message: `Admin ${adminUser.email} generated a password reset link for user ${targetUser.email}.`,
		actionUrl: `/admin/users?userId=${targetUser.id}`,
		data: {
			adminUserId: adminUser.id,
			targetUserId: targetUser.id,
			expiresAt,
		},
	});

	return c.json({
		token,
		resetUrl,
		expiresAt,
	});
});

export default route;
