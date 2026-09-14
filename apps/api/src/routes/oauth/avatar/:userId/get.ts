import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { getProfileAvatarResponse } from "@/lib/profileAvatar";

const route = new Hono<{ Bindings: Env }>();

route.get("/", async (c) => {
	const userId = c.req.param("userId");

	if (!userId) {
		return c.notFound();
	}

	const db = createDb(c.env.DB);

	const result = await db
		.select({
			profileImageKey: users.profileImageKey,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	const user = result[0];

	const response = await getProfileAvatarResponse(
		c.env.PROFILE_BUCKET,
		user?.profileImageKey ?? null,
		"public",
	);

	return response ?? c.notFound();
});

export default route;
