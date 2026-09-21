import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { userSshKeys } from "@/db/schema";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireAnyPermission } from "@/middleware/auth";
import {
	ErrorResponseSchema,
	IdParamSchema,
	SuccessResponseSchema,
} from "@/schemas/common";

export const deleteSshKeyRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["SSH Keys & CA"],
	summary: "Delete registered SSH public key",
	description:
		"Remove an enrolled SSH key by ID. Caller must own the key or possess administrative privileges.",
	request: {
		params: IdParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "Key deleted",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Key ID required",
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
			description: "Forbidden",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Key not found",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requireAnyPermission("ssh:keys:manage", "ssh:keys:admin"));

route.openapi(deleteSshKeyRoute, async (c) => {
	const { id: keyId } = c.req.valid("param");

	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const db = createDb(c.env.DB);

	const [key] = await db
		.select({
			id: userSshKeys.id,
			userId: userSshKeys.userId,
		})
		.from(userSshKeys)
		.where(eq(userSshKeys.id, keyId))
		.limit(1);

	if (!key) {
		return c.json({ error: "Key not found." }, 404);
	}

	const canAdminKeys =
		roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
		hasPermission(permissions, "ssh:keys:admin") ||
		hasPermission(permissions, "ssh:*") ||
		hasPermission(permissions, "*");

	if (key.userId !== user.id && !canAdminKeys) {
		return c.json(
			{
				error: "Insufficient permissions to delete another user's SSH key.",
			},
			403,
		);
	}

	await db.delete(userSshKeys).where(eq(userSshKeys.id, keyId));

	return c.json(
		{
			success: true,
		},
		200,
	);
});

export default route;
