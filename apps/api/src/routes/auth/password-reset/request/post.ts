import { Hono } from "hono";

import { createDb } from "@/db";
import { requestPasswordResetNotification } from "@/lib/password-reset";

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
	const body = await c.req.json<{ email?: string }>();
	const email = body.email?.trim();

	if (!email?.includes("@")) {
		return c.json(
			{
				error: "A valid email address is required.",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);
	const ipAddress = c.req.header("CF-Connecting-IP") || undefined;
	const userAgent = c.req.header("User-Agent") || undefined;

	await requestPasswordResetNotification(db, email, {
		ipAddress,
		userAgent,
	});

	// Always return a generic 200 response to prevent user enumeration
	return c.json({
		message:
			"If an active account matches that email address, a password reset request has been submitted to your instance administrators.",
	});
});

export default route;
