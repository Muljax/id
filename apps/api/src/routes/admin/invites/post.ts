import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { roles } from "@/db/schema";
import { createInviteToken } from "@/lib/invites";
import { emitNotification } from "@/lib/notifications/emitter";
import { getUserPermissions } from "@/lib/rbac/permissions";
import { canUserAssignRoles } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post("/", requirePermission("users:write"), async (c) => {
	const body = await c.req
		.json<{
			email?: string;
			roleId?: string;
			ttlHours?: number;
		}>()
		.catch(() => null);

	const email = body?.email?.trim().toLowerCase() || undefined;
	const roleId = body?.roleId?.trim() || "user";
	const ttlHours =
		typeof body?.ttlHours === "number" ? body.ttlHours : undefined;

	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return c.json({ error: "Invalid email format." }, 400);
	}

	const db = createDb(c.env.DB);

	// Verify target role exists
	const roleRecord = await db
		.select({ id: roles.id })
		.from(roles)
		.where(eq(roles.id, roleId))
		.limit(1);

	if (roleRecord.length === 0) {
		return c.json({ error: `Role '${roleId}' does not exist.` }, 400);
	}

	const currentUser = c.get("user");
	const callerPermissions = await getUserPermissions(db, currentUser.id);
	const check = await canUserAssignRoles(db, callerPermissions, [roleId]);
	if (!check.allowed) {
		return c.json(
			{
				error:
					"Cannot create invite: you do not possess all permissions granted by this role.",
				missingPermissions: check.missingPermissions,
			},
			403,
		);
	}

	const invite = await createInviteToken(db, {
		email,
		roleId,
		createdByUserId: currentUser?.id,
		ttlHours,
	});

	const url = new URL(c.req.url);
	const inviteUrl = `${url.origin}/register?invite=${encodeURIComponent(invite.token)}`;

	await emitNotification(db, {
		target: "admins",
		type: "admin.invite_created",
		category: "admin",
		severity: "info",
		title: "User Invite Generated",
		message: `Admin ${currentUser?.email} generated an invitation token${
			email ? ` for ${email}` : ""
		}.`,
		actionUrl: "/admin/users",
	});

	return c.json(
		{
			invite: {
				...invite,
				inviteUrl,
			},
		},
		201,
	);
});

export default route;
