import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { getSessionUserWithSession, getUserSessions } from "@/lib/session";
import { isUserDisabled } from "@/lib/user";

const route = new Hono<{ Bindings: Env }>();

route.get("/", async (c) => {
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
	const userSessions = await getUserSessions(db, currentSession.userId);

	return c.json({
		sessions: userSessions.map((session) => ({
			...session,
			current: session.id === currentSession.id,
		})),
	});
});

export default route;
