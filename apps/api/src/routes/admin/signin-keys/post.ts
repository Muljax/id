import { Hono } from "hono";

import { createDb } from "@/db";
import { emitNotification } from "@/lib/notifications/emitter";
import { createSigninKey } from "@/lib/signinKeys";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post("/", requirePermission("settings:write"), async (c) => {
	const body = await c.req
		.json<{
			name?: string;
			ttlHours?: number;
		}>()
		.catch(() => null);

	const name = body?.name?.trim();
	const ttlHours =
		typeof body?.ttlHours === "number" ? body.ttlHours : undefined;

	if (!name) {
		return c.json({ error: "Key label name is required." }, 400);
	}

	const db = createDb(c.env.DB);
	const currentUser = c.get("user");

	const signinKey = await createSigninKey(db, {
		name,
		createdByUserId: currentUser?.id,
		ttlHours,
	});

	await emitNotification(db, {
		target: "admins",
		type: "admin.signin_key_created",
		category: "admin",
		severity: "warning",
		title: "Admin Sign-in Key Created",
		message: `Admin ${currentUser?.email} generated new access key "${name}".`,
		actionUrl: "/admin/settings",
	});

	return c.json(
		{
			key: signinKey,
		},
		201,
	);
});

export default route;
