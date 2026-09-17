import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { userSshKeys } from "@/db/schema";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireAuth } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requireAuth, async (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const db = createDb(c.env.DB);

	const canAdminKeys =
		roles.includes("admin") ||
		hasPermission(permissions, "ssh:keys:admin") ||
		hasPermission(permissions, "ssh:*") ||
		hasPermission(permissions, "*");

	const requestedUserId = c.req.query("userId");
	const showAll = c.req.query("all") === "true" && canAdminKeys;

	let targetUserId = user.id;
	if (requestedUserId && requestedUserId !== user.id) {
		if (!canAdminKeys) {
			return c.json(
				{
					error: "forbidden",
					message: "Insufficient permissions to view another user's SSH keys.",
				},
				403,
			);
		}
		targetUserId = requestedUserId;
	}

	const baseQuery = db
		.select({
			id: userSshKeys.id,
			userId: userSshKeys.userId,
			name: userSshKeys.name,
			publicKey: userSshKeys.publicKey,
			fingerprint: userSshKeys.fingerprint,
			createdAt: userSshKeys.createdAt,
			lastUsedAt: userSshKeys.lastUsedAt,
		})
		.from(userSshKeys);

	const keys = showAll
		? await baseQuery.orderBy(desc(userSshKeys.createdAt)).limit(100)
		: await baseQuery
				.where(eq(userSshKeys.userId, targetUserId))
				.orderBy(desc(userSshKeys.createdAt));

	return c.json({
		keys,
	});
});

export default route;
