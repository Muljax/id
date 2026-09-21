import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { type AppEnv, requireSessionAuth } from "@/middleware/auth";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const UploadAvatarFormSchema = z.object({
	file: z.any().openapi({
		type: "string",
		format: "binary",
		description: "Profile picture image file (JPEG, PNG, or WebP up to 5MB)",
	}),
});

export const updateAvatarRoute = createRoute({
	method: "put",
	path: "/",
	tags: ["Account & Profile"],
	summary: "Upload profile avatar",
	description:
		"Upload a new JPEG, PNG, or WebP profile picture (max 5MB) via multipart form data.",
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: UploadAvatarFormSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Profile picture uploaded successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid file format or file too large",
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

route.openapi(updateAvatarRoute, async (c) => {
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

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
