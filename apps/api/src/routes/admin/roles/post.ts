import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { roles } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { createRole } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post("/", requirePermission("roles:write"), async (c) => {
	const body = await c.req
		.json<{
			name?: string;
			description?: string;
			permissions?: string[];
		}>()
		.catch(() => null);

	if (!body || typeof body.name !== "string" || !body.name.trim()) {
		return c.json(
			{
				error: "Role name is required.",
			},
			400,
		);
	}

	const roleName = body.name.trim();

	if (roleName.length > 64) {
		return c.json(
			{
				error: "Role name must not exceed 64 characters.",
			},
			400,
		);
	}

	if (body.permissions && !Array.isArray(body.permissions)) {
		return c.json(
			{
				error: "Permissions must be an array of strings.",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);

	const existing = await db
		.select({ id: roles.id })
		.from(roles)
		.where(eq(roles.name, roleName))
		.limit(1);

	if (existing.length > 0) {
		return c.json(
			{
				error: `A role named '${roleName}' already exists.`,
			},
			409,
		);
	}

	const newRole = await createRole(db, {
		name: roleName,
		description: body.description,
		permissions: body.permissions,
	});

	const adminUser = c.get("user");

	await emitNotification(db, {
		target: "admins",
		type: "admin.role_created",
		category: "admin",
		severity: "info",
		title: "Role Created",
		message: `Admin ${adminUser.email} created role "${roleName}".`,
		actionUrl: "/admin/roles",
	});

	return c.json(
		{
			role: newRole,
		},
		201,
	);
});

export default route;
