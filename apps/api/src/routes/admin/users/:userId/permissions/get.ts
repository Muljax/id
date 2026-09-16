import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { getUserEffectivePermissions } from "@/lib/rbac/permissions";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("roles:read"), async (c) => {
	const userId = c.req.param("userId");

	if (!userId) {
		return c.json({ error: "User ID is required." }, 400);
	}

	const db = createDb(c.env.DB);

	const [user] = await db
		.select({ id: users.id, email: users.email })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!user) {
		return c.json({ error: "User not found." }, 404);
	}

	const { roles, permissions } = await getUserEffectivePermissions(db, userId);

	return c.json({
		userId: user.id,
		email: user.email,
		roles,
		permissions: Array.from(permissions),
	});
});

export default route;
