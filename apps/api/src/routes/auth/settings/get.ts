import { Hono } from "hono";

import { createDb } from "@/db";
import { getOrCreateInstanceSettings } from "@/lib/settings";

const route = new Hono<{ Bindings: Env }>();

route.get("/", async (c) => {
	const db = createDb(c.env.DB);
	const settings = await getOrCreateInstanceSettings(db);

	return c.json({
		signupMode: settings.signupMode,
		signinMode: settings.signinMode,
	});
});

export default route;
