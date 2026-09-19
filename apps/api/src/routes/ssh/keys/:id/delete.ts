import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { userSshKeys } from "@/db/schema";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireAnyPermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.delete(
	"/",
	requireAnyPermission("ssh:keys:manage", "ssh:keys:admin"),
	async (c) => {
		const keyId = c.req.param("id");
		if (!keyId) {
			return c.json({ error: "Key ID is required." }, 400);
		}

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
					error: "forbidden",
					message: "Insufficient permissions to delete another user's SSH key.",
				},
				403,
			);
		}

		await db.delete(userSshKeys).where(eq(userSshKeys.id, keyId));

		return c.body(null, 204);
	},
);

export default route;
