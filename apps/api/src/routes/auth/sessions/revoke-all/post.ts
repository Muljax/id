import { Hono } from "hono";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { deleteOtherSessions } from "@/lib/session";
import { requireAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.post("/", requireAuth, async (c) => {
	const user = c.get("user");
	const currentSession = c.get("session");
	const db = createDb(c.env.DB);

	await deleteOtherSessions(db, user.id, currentSession.id);

	await emitNotification(db, {
		userId: user.id,
		type: "security.sessions_revoked",
		category: "security",
		severity: "warning",
		title: "All Other Sessions Terminated",
		message: "You signed out of all other active sessions.",
	});

	return c.json({
		success: true,
	});
});

export default route;
