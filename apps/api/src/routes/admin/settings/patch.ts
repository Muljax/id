import { Hono } from "hono";

import { createDb } from "@/db";
import {
	mode,
	type SigninMode,
	type SignupMode,
} from "@/db/schema/instanceSettings";
import { emitNotification } from "@/lib/notifications/emitter";
import { updateInstanceSettings } from "@/lib/settings";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.patch("/", requirePermission("settings:write"), async (c) => {
	const body = await c.req
		.json<{
			signupMode?: string;
			signinMode?: string;
		}>()
		.catch(() => null);

	if (!body || typeof body !== "object") {
		return c.json({ error: "Request body must be a JSON object." }, 400);
	}

	if (
		body.signupMode !== undefined &&
		!mode.signup.includes(body.signupMode as SignupMode)
	) {
		return c.json(
			{
				error: `Invalid signupMode. Must be one of: ${mode.signup.join(", ")}.`,
			},
			400,
		);
	}

	if (
		body.signinMode !== undefined &&
		!mode.signin.includes(body.signinMode as SigninMode)
	) {
		return c.json(
			{
				error: `Invalid signinMode. Must be one of: ${mode.signin.join(", ")}.`,
			},
			400,
		);
	}

	const db = createDb(c.env.DB);
	const updated = await updateInstanceSettings(db, {
		signupMode: body.signupMode as SignupMode | undefined,
		signinMode: body.signinMode as SigninMode | undefined,
	});

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.settings_updated",
		category: "admin",
		severity: "info",
		title: "Instance Settings Updated",
		message: `Admin ${adminUser.email} updated tenant configuration.`,
		actionUrl: "/admin/settings",
	});

	return c.json({
		settings: updated,
	});
});

export default route;
