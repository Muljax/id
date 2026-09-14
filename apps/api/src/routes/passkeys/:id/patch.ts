import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { passkeys } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

const route = new Hono<{ Bindings: Env }>();

route.patch("/", async (c) => {
	const token = getCookie(c, "session");

	if (!token) {
		return c.json(
			{
				error: "Unauthorized",
			},
			401,
		);
	}

	const db = createDb(c.env.DB);
	const user = await getSessionUser(db, token);

	if (!user) {
		return c.json(
			{
				error: "Unauthorized",
			},
			401,
		);
	}

	const passkeyId = c.req.param("id");

	if (!passkeyId) {
		return c.json(
			{
				error: "Passkey not found.",
			},
			404,
		);
	}

	const body = await c.req.json<{
		name?: string;
	}>();

	const name = body.name?.trim();

	if (!name) {
		return c.json(
			{
				error: "Passkey name is required.",
			},
			400,
		);
	}

	if (name.length > 100) {
		return c.json(
			{
				error: "Passkey name must be 100 characters or less.",
			},
			400,
		);
	}

	const result = await db
		.update(passkeys)
		.set({
			name,
		})
		.where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, user.id)))
		.returning({
			id: passkeys.id,
		});

	if (result.length === 0) {
		return c.json(
			{
				error: "Passkey not found.",
			},
			404,
		);
	}

	return c.json({
		success: true,
	});
});

export default route;
