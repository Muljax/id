import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { type AppEnv, requireSessionAuth } from "@/middleware/auth";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

export const deleteAvatarRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Account & Profile"],
	summary: "Delete profile avatar",
	description:
		"Remove the user's custom profile picture and reset to default avatar.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Profile picture removed successfully",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requireSessionAuth);

route.openapi(deleteAvatarRoute, async (c) => {
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

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
