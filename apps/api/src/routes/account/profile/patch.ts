import { and, eq, ne } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { requireSessionAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.patch("/", requireSessionAuth, async (c) => {
	const body = await c.req.json();

	if (typeof body !== "object" || body === null) {
		return c.json(
			{
				error: "Request body must be an object.",
			},
			400,
		);
	}

	const updates: Partial<typeof users.$inferInsert> = {};

	if ("displayName" in body) {
		if (typeof body.displayName !== "string") {
			return c.json(
				{
					error: "Display name must be a string.",
				},
				400,
			);
		}

		const displayName = body.displayName.trim();

		if (displayName.length > 100) {
			return c.json(
				{
					error: "Display name must be 100 characters or fewer.",
				},
				400,
			);
		}

		updates.displayName = displayName || null;
	}

	if ("givenName" in body) {
		if (typeof body.givenName !== "string") {
			return c.json(
				{
					error: "Given name must be a string.",
				},
				400,
			);
		}

		updates.givenName = body.givenName.trim() || null;
	}

	if ("familyName" in body) {
		if (typeof body.familyName !== "string") {
			return c.json(
				{
					error: "Family name must be a string.",
				},
				400,
			);
		}

		updates.familyName = body.familyName.trim() || null;
	}

	if ("middleName" in body) {
		if (typeof body.middleName !== "string") {
			return c.json(
				{
					error: "Middle name must be a string.",
				},
				400,
			);
		}

		updates.middleName = body.middleName.trim() || null;
	}

	if ("nickname" in body) {
		if (typeof body.nickname !== "string") {
			return c.json(
				{
					error: "Nickname must be a string.",
				},
				400,
			);
		}

		updates.nickname = body.nickname.trim() || null;
	}

	if ("preferredUsername" in body) {
		if (typeof body.preferredUsername !== "string") {
			return c.json(
				{
					error: "Preferred username must be a string.",
				},
				400,
			);
		}

		const preferredUsername = body.preferredUsername.trim();

		if (preferredUsername.length > 100) {
			return c.json(
				{
					error: "Preferred username must be 100 characters or fewer.",
				},
				400,
			);
		}

		updates.preferredUsername = preferredUsername || null;
	}

	if ("profileUrl" in body) {
		if (typeof body.profileUrl !== "string") {
			return c.json(
				{
					error: "Profile URL must be a string.",
				},
				400,
			);
		}

		updates.profileUrl = body.profileUrl.trim() || null;
	}

	if ("website" in body) {
		if (typeof body.website !== "string") {
			return c.json(
				{
					error: "Website must be a string.",
				},
				400,
			);
		}

		updates.website = body.website.trim() || null;
	}

	if ("gender" in body) {
		if (typeof body.gender !== "string") {
			return c.json(
				{
					error: "Gender must be a string.",
				},
				400,
			);
		}

		updates.gender = body.gender.trim() || null;
	}

	if ("birthdate" in body) {
		if (typeof body.birthdate !== "string") {
			return c.json(
				{
					error: "Birthdate must be a string.",
				},
				400,
			);
		}

		updates.birthdate = body.birthdate.trim() || null;
	}

	if ("zoneinfo" in body) {
		if (typeof body.zoneinfo !== "string") {
			return c.json(
				{
					error: "Zoneinfo must be a string.",
				},
				400,
			);
		}

		updates.zoneinfo = body.zoneinfo.trim() || null;
	}

	if ("locale" in body) {
		if (typeof body.locale !== "string") {
			return c.json(
				{
					error: "Locale must be a string.",
				},
				400,
			);
		}

		updates.locale = body.locale.trim() || null;
	}

	if (Object.keys(updates).length === 0) {
		return c.json(
			{
				error: "No profile fields provided.",
			},
			400,
		);
	}

	updates.updatedAt = Date.now();

	const user = c.get("user");
	const db = createDb(c.env.DB);

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

	return c.json({
		success: true,
	});
});

export default route;
