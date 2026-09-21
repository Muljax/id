import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { userRoles } from "@/db/schema";
import { timingSafeEqual } from "@/lib/crypto";
import { emitNotification } from "@/lib/notifications/emitter";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { getSessionUser } from "@/lib/session";
import { AdminBootstrapRequestSchema } from "@/schemas/admin";
import { ErrorResponseSchema, SuccessResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const adminBootstrapRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Admin"],
	summary: "Bootstrap initial super-administrator",
	description:
		"Claims initial super-administrator permissions for an instance using the configured ADMIN_BOOTSTRAP_SECRET.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: AdminBootstrapRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Super-administrator role granted successfully",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid bootstrap secret",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Admin bootstrap has already been completed",
		},
		503: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Admin bootstrap is not configured",
		},
	},
});

route.openapi(adminBootstrapRoute, async (c) => {
	const bootstrapSecret = c.env.ADMIN_BOOTSTRAP_SECRET;

	if (!bootstrapSecret) {
		return c.json(
			{
				error: "Admin bootstrap is not configured.",
			},
			503,
		);
	}

	const token = getCookie(c, "session");

	if (!token) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = createDb(c.env.DB);
	const user = await getSessionUser(db, token);

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = c.req.valid("json");

	if (!body.secret || !(await timingSafeEqual(body.secret, bootstrapSecret))) {
		return c.json(
			{
				error: "Invalid bootstrap secret.",
			},
			403,
		);
	}

	const existingAdmin = await db
		.select({ userId: userRoles.userId })
		.from(userRoles)
		.where(eq(userRoles.roleId, SYSTEM_ROLE_IDS.ADMIN))
		.limit(1);

	if (existingAdmin.length > 0) {
		return c.json(
			{
				error: "Admin bootstrap has already been completed.",
			},
			409,
		);
	}

	await db.insert(userRoles).values({
		userId: user.id,
		roleId: SYSTEM_ROLE_IDS.ADMIN,
		assignedAt: Date.now(),
	});

	await emitNotification(db, {
		userId: user.id,
		type: "admin.bootstrap_claimed",
		category: "admin",
		severity: "success",
		title: "Administrator Privileges Granted",
		message:
			"You have successfully claimed super-administrator permissions for this tenant.",
		actionUrl: "/admin/users",
	});

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
