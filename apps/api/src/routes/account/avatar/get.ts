import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { getProfileAvatarResponse } from "@/lib/profileAvatar";
import { type AppEnv, requireAuth } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";

export const getAvatarRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Account & Profile"],
	summary: "Get profile avatar",
	description: "Retrieve the current user's profile avatar image from storage.",
	responses: {
		200: {
			description: "Avatar binary image content",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Profile picture not found",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requireAuth);

route.openapi(getAvatarRoute, async (c) => {
	const user = c.get("user");

	const response = await getProfileAvatarResponse(
		c.env.PROFILE_BUCKET,
		user.profileImageKey,
		"private",
	);

	return response ?? c.json({ error: "Profile picture not found." }, 404);
});

export default route;
