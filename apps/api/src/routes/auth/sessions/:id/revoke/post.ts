import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { sessions } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { getUserSession } from "@/lib/session";
import { requireSessionAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.post("/", requireSessionAuth, async (c) => {
	const user = c.get("user");
	const db = createDb(c.env.DB);
	const sessionId = c.req.param("id");

	if (!sessionId) {
		return c.json({ error: "Session not found" }, 404);
	}

	const session = await getUserSession(db, user.id, sessionId);

	if (!session) {
		return c.json({ error: "Session not found" }, 404);
	}

	await db.delete(sessions).where(eq(sessions.id, session.id));

	await emitNotification(db, {
		userId: user.id,
		type: "security.session_revoked",
		category: "security",
		severity: "info",
		title: "Session Terminated",
		message: `A session (${session.ipAddress || "unknown IP"}) was revoked.`,
	});

	return c.json({
		success: true,
	});
});

export default route;
