import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { roles } from "@/db/schema";
import { createInviteToken } from "@/lib/invites";
import { emitNotification } from "@/lib/notifications/emitter";
import { getUserPermissions } from "@/lib/rbac/permissions";
import { canUserAssignRoles } from "@/lib/rbac/roles";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import {
	AdminInviteCreatedResponseSchema,
	CreateInviteRequestSchema,
} from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const createAdminInviteRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Admin Invites"],
	summary: "Create a user invite",
	description:
		"Generates a new invitation token for account registration with a pre-assigned role.",
	middleware: [requirePermission("users:write")] as const,
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateInviteRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: AdminInviteCreatedResponseSchema,
				},
			},
			description: "Invitation token created successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - Invalid payload or non-existent role",
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
			description:
				"Forbidden - Insufficient permissions to assign requested role",
		},
	},
});

route.openapi(createAdminInviteRoute, async (c) => {
	const body = c.req.valid("json");

	const email = body.email?.trim().toLowerCase() || undefined;
	const roleId = body.roleId?.trim() || "user";
	const ttlHours = body.ttlHours;

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
