import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { deleteOtherSessions, getSessionUserWithSession } from "@/lib/session";
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

	await deleteOtherSessions(db, currentSession.userId, currentSession.id);

	return c.json({
		success: true,
	});
});

export default route;
