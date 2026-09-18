import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { passkeys } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { requireSessionAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.delete("/", requireSessionAuth, async (c) => {
	const user = c.get("user");
	const passkeyId = c.req.param("id");

	if (!passkeyId) {
		return c.json(
			{
				error: "Passkey not found.",
			},
			404,
		);
	}

	const db = createDb(c.env.DB);

	const result = await db
		.delete(passkeys)
		.where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, user.id)))
		.returning({ id: passkeys.id, name: passkeys.name });

	if (result.length === 0) {
		return c.json(
			{
				error: "Passkey not found.",
			},
			404,
		);
	}

	await emitNotification(db, {
		userId: user.id,
		type: "security.passkey_removed",
		category: "security",
		severity: "warning",
		title: "Passkey Removed",
		message: `The passkey (${result[0].name ?? "Unnamed"}) was removed from your account.`,
		actionUrl: "/account/passkeys",
	});

	return c.json({
		success: true,
	});
});

export default route;
