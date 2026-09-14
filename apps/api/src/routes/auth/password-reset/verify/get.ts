import { Hono } from "hono";

import { createDb } from "@/db";
import { verifyPasswordResetToken } from "@/lib/password-reset";

const route = new Hono<{ Bindings: Env }>();

route.get("/", async (c) => {
	const token = c.req.query("token");

	if (!token) {
		return c.json(
			{
				valid: false,
				error: "Missing token parameter",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);
	const record = await verifyPasswordResetToken(db, token);

	if (!record) {
		return c.json(
			{
				valid: false,
				error: "Invalid or expired password reset token",
			},
			400,
		);
	}

	return c.json({
		valid: true,
		email: record.userEmail,
		expiresAt: record.expiresAt,
	});
});

export default route;
