import { and, eq, or } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.post("/", requireAuth, async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");

	if (!id) {
		return c.json({ error: "Notification not found" }, 404);
	}

	const db = createDb(c.env.DB);

	const targetConditions = [
		eq(notifications.userId, user.id),
		eq(notifications.target, "all"),
	];

	if (user.isAdmin) {
		targetConditions.push(eq(notifications.target, "admins"));
	}

	const result = await db
		.update(notifications)
		.set({ readAt: Date.now() })
		.where(and(eq(notifications.id, id), or(...targetConditions)))
		.returning({ id: notifications.id });

	if (result.length === 0) {
		return c.json({ error: "Notification not found" }, 404);
	}

	return c.json({ success: true });
});

export default route;
