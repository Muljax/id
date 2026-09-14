import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { sessions } from "@/db/schema";
import { getSessionUserWithSession, getUserSession } from "@/lib/session";
import { isUserDisabled } from "@/lib/user";

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
	const token = getCookie(c, "session");

	if (!token) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = createDb(c.env.DB);
	const record = await getSessionUserWithSession(db, token);

	if (!record || isUserDisabled(record.user)) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const currentSession = record.session;

	const sessionId = c.req.param("id");

	if (!sessionId) {
		return c.json({ error: "Session not found" }, 404);
	}

	const session = await getUserSession(db, currentSession.userId, sessionId);

	if (!session) {
		return c.json({ error: "Session not found" }, 404);
	}

	await db.delete(sessions).where(eq(sessions.id, session.id));

	return c.json({
		success: true,
	});
});

export default route;
