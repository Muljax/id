import { Hono } from "hono";

import { getProfileAvatarResponse } from "@/lib/profileAvatar";
import { requireAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.get("/", requireAuth, async (c) => {
	const user = c.get("user");

	const response = await getProfileAvatarResponse(
		c.env.PROFILE_BUCKET,
		user.profileImageKey,
		"private",
	);

	return response ?? c.json({ error: "Profile picture not found." }, 404);
});

export default route;
