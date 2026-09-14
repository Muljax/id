import { and, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.post("/", requireAuth, async (c) => {
	const user = c.get("user");
	const db = createDb(c.env.DB);

	const targetConditions = [
		eq(notifications.userId, user.id),
		eq(notifications.target, "all"),
	];

	if (user.isAdmin) {
		targetConditions.push(eq(notifications.target, "admins"));
	}

	await db
		.update(notifications)
		.set({ readAt: Date.now() })
		.where(and(or(...targetConditions), isNull(notifications.readAt)));

	return c.json({ success: true });
});

export default route;
