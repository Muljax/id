import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { requireAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.delete("/", requireAuth, async (c) => {
	const user = c.get("user");
	const db = createDb(c.env.DB);
	if (user.profileImageKey) {
		await c.env.PROFILE_BUCKET.delete(user.profileImageKey);
	}

	await db
		.update(users)
		.set({
			profileImageKey: null,
			updatedAt: Date.now(),
		})
		.where(eq(users.id, user.id));

	await emitNotification(db, {
		userId: user.id,
		type: "account.avatar_removed",
		category: "general",
		severity: "info",
		title: "Profile Picture Removed",
		message: "Your profile picture was removed.",
		actionUrl: "/account/profile",
	});

	return c.json({
		success: true,
	});
});

export default route;
