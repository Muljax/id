import { and, eq, ne } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { type AppEnv, requireSessionAuth } from "@/middleware/auth";
import { UpdateProfileRequestSchema } from "@/schemas/account";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

export const updateProfileRoute = createRoute({
	method: "patch",
	path: "/",
	tags: ["Account & Profile"],
	summary: "Update profile information",
	description:
		"Update user profile attributes (display name, POSIX username, avatar key, locale, timezone, etc.).",
	request: {
		body: {
			content: {
				"application/json": {
					schema: UpdateProfileRequestSchema,
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
			description: "Profile successfully updated",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid profile data",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Username is already taken",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requireSessionAuth);

route.openapi(updateProfileRoute, async (c) => {
	const body = c.req.valid("json");
	const user = c.get("user");
	const db = createDb(c.env.DB);

	const updates: Partial<typeof users.$inferInsert> = {};

	if (body.displayName !== undefined)
		updates.displayName = body.displayName ? body.displayName.trim() : null;
	if (body.givenName !== undefined)
		updates.givenName = body.givenName ? body.givenName.trim() : null;
	if (body.familyName !== undefined)
		updates.familyName = body.familyName ? body.familyName.trim() : null;
	if (body.middleName !== undefined)
		updates.middleName = body.middleName ? body.middleName.trim() : null;
	if (body.nickname !== undefined)
		updates.nickname = body.nickname ? body.nickname.trim() : null;
	if (body.preferredUsername !== undefined)
		updates.preferredUsername = body.preferredUsername
			? body.preferredUsername.trim()
			: null;
	if (body.profileUrl !== undefined)
		updates.profileUrl = body.profileUrl ? body.profileUrl.trim() : null;
	if (body.website !== undefined)
		updates.website = body.website ? body.website.trim() : null;
	if (body.gender !== undefined)
		updates.gender = body.gender ? body.gender.trim() : null;
	if (body.birthdate !== undefined)
		updates.birthdate = body.birthdate ? body.birthdate.trim() : null;
	if (body.zoneinfo !== undefined)
		updates.zoneinfo = body.zoneinfo ? body.zoneinfo.trim() : null;
	if (body.locale !== undefined)
		updates.locale = body.locale ? body.locale.trim() : null;

	if (Object.keys(updates).length === 0) {
		return c.json(
			{
				error: "No profile fields provided.",
			},
			400,
		);
	}

	updates.updatedAt = Date.now();

	if (updates.preferredUsername) {
		const existingUser = await db
			.select({ id: users.id })
			.from(users)
			.where(
				and(
					eq(users.preferredUsername, updates.preferredUsername),
					ne(users.id, user.id),
				),
			)
			.limit(1);

		if (existingUser.length > 0) {
			return c.json(
				{
					error: "Username is already taken.",
				},
				409,
			);
		}
	}

	try {
		await db.update(users).set(updates).where(eq(users.id, user.id));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);

		if (
			message.toLowerCase().includes("unique") ||
			message.toLowerCase().includes("constraint")
		) {
			return c.json(
				{
					error: "Username is already taken.",
				},
				409,
			);
		}

		throw error;
	}

	await emitNotification(db, {
		userId: user.id,
		type: "account.profile_updated",
		category: "general",
		severity: "success",
		title: "Profile Updated",
		message: "Your profile details were updated successfully.",
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
