import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { requireSessionAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

route.put("/", requireSessionAuth, async (c) => {
	const contentType = c.req.header("Content-Type");

	if (!contentType?.startsWith("multipart/form-data")) {
		return c.json(
			{
				error: "Profile picture must be uploaded as multipart form data.",
			},
			400,
		);
	}

	const formData = await c.req.formData();
	const file = formData.get("file");

	if (!(file instanceof File)) {
		return c.json({ error: "A profile picture is required." }, 400);
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		return c.json(
			{
				error: "Profile picture must be a JPEG, PNG, or WebP image.",
			},
			400,
		);
	}

	if (file.size > MAX_FILE_SIZE) {
		return c.json(
			{
				error: "Profile picture must be 5 MB or smaller.",
			},
			400,
		);
	}

	const user = c.get("user");
	const db = createDb(c.env.DB);

	const oldKey = user.profileImageKey;
	const key = `profiles/${user.id}/avatar/${crypto.randomUUID()}`;

	await c.env.PROFILE_BUCKET.put(key, file.stream(), {
		httpMetadata: {
			contentType: file.type,
			cacheControl: "private, max-age=3600",
		},
	});

	await db
		.update(users)
		.set({
			profileImageKey: key,
			updatedAt: Date.now(),
		})
		.where(eq(users.id, user.id));

	if (oldKey) {
		await c.env.PROFILE_BUCKET.delete(oldKey);
	}

	await emitNotification(db, {
		userId: user.id,
		type: "account.avatar_updated",
		category: "general",
		severity: "success",
		title: "Profile Picture Updated",
		message: "Your new profile picture has been uploaded.",
		actionUrl: "/account/profile",
	});

	return c.json({
		success: true,
	});
});

export default route;
