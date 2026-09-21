import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { getProfileAvatarResponse } from "@/lib/profileAvatar";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const getPublicUserAvatarRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Users"],
	summary: "Get public user avatar",
	description:
		"Streams the public profile avatar image for the specified user.",
	request: {
		params: z.object({
			userId: z.string().openapi({
				param: {
					name: "userId",
					in: "path",
				},
				example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
				description: "User ID",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"image/*": {
					schema: z.string(),
				},
			},
			description: "Avatar image data",
		},
		304: {
			description: "Avatar unmodified (ETag matched)",
		},
		404: {
			description: "User or avatar image not found",
		},
	},
});

route.openapi(getPublicUserAvatarRoute, async (c) => {
	const { userId } = c.req.valid("param");

	if (!userId) {
		return c.notFound();
	}

	const db = createDb(c.env.DB);

	const [user] = await db
		.select({
			profileImageKey: users.profileImageKey,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	const response = await getProfileAvatarResponse(
		c.env.PROFILE_BUCKET,
		user?.profileImageKey ?? null,
		"public",
	);

	return response ?? c.notFound();
});

export default route;
