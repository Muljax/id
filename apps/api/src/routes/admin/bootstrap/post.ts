import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { timingSafeEqual } from "@/lib/crypto";
import { getSessionUser } from "@/lib/session";

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
	const bootstrapSecret = c.env.ADMIN_BOOTSTRAP_SECRET;

	if (!bootstrapSecret) {
		return c.json(
			{
				error: "Admin bootstrap is not configured.",
			},
			503,
		);
	}

	const token = getCookie(c, "session");

	if (!token) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = createDb(c.env.DB);
	const user = await getSessionUser(db, token);

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json<{
		secret?: string;
	}>();

	if (!body.secret || !(await timingSafeEqual(body.secret, bootstrapSecret))) {
		return c.json(
			{
				error: "Invalid bootstrap secret.",
			},
			403,
		);
	}

	const result = await db
		.update(users)
		.set({
			isAdmin: true,
			updatedAt: Date.now(),
		})
		.where(
			sql`${eq(users.id, user.id)}
                AND NOT EXISTS (
                    SELECT 1
                    FROM users
                    WHERE is_admin = 1
                )`,
		);

	if (result.meta.changes !== 1) {
		return c.json(
			{
				error: "Admin bootstrap has already been completed.",
			},
			409,
		);
	}

	return c.json({
		success: true,
	});
});

export default route;
