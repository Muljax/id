import { Hono } from "hono";

import { createDb } from "@/db";
import { consumePasswordResetToken } from "@/lib/password-reset";

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
	const body = await c.req.json<{
		token?: string;
		newPassword?: string;
	}>();

	const token = body.token?.trim();
	const newPassword = body.newPassword;

	if (!token || !newPassword) {
		return c.json(
			{
				error: "Token and new password are required",
			},
			400,
		);
	}

	if (newPassword.length < 8 || newPassword.length > 128) {
		return c.json(
			{
				error: "Password must be between 8 and 128 characters",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);

	try {
		await consumePasswordResetToken(db, token, newPassword);

		return c.json({
			success: true,
			message: "Password successfully updated. You may now log in.",
		});
	} catch {
		return c.json(
			{
				error: "Invalid or expired password reset token",
			},
			400,
		);
	}
});

export default route;
