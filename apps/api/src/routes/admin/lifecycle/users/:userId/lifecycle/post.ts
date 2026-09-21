import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { lifecycleActions, users } from "@/db/schema";
import { deleteUser } from "@/lib/lifecycle/actions/delete";
import { disableUser } from "@/lib/lifecycle/actions/disable";
import { enableUser } from "@/lib/lifecycle/actions/enable";
import { emitNotification } from "@/lib/notifications/emitter";
import { isSoleAdministrator } from "@/lib/rbac/permissions";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import {
	AdminUserLifecycleRequestSchema,
	AdminUserLifecycleResponseSchema,
} from "@/schemas/admin";
import { ErrorResponseSchema } from "@/schemas/common";

const route = new OpenAPIHono<AppEnv>();

export const adminUserLifecycleRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Admin Users"],
	summary: "Manage user account lifecycle",
	description:
		"Enables, disables, or permanently deletes a user account, either immediately or at a scheduled timestamp.",
	middleware: [requirePermission("users:lifecycle")] as const,
	request: {
		params: z.object({
			userId: z.string().openapi({
				param: {
					name: "userId",
					in: "path",
				},
				example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
				description: "Target user ID",
			}),
		}),
		body: {
			content: {
				"application/json": {
					schema: AdminUserLifecycleRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AdminUserLifecycleResponseSchema,
				},
			},
			description: "Immediate lifecycle action completed",
		},
		201: {
			content: {
				"application/json": {
					schema: AdminUserLifecycleResponseSchema,
				},
			},
			description: "Lifecycle action scheduled successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description:
				"Bad request - Self-modification or sole admin protection or invalid schedule",
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
			description: "Forbidden - Insufficient permissions",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "User not found",
		},
	},
});

route.openapi(adminUserLifecycleRoute, async (c) => {
	const { userId } = c.req.valid("param");
	const { action, executeAt } = c.req.valid("json");

	const currentUser = c.get("user");
	if (
		(action === "disable" || action === "delete") &&
		currentUser &&
		userId === currentUser.id
	) {
		return c.json(
			{
				error: `You cannot ${action} your own administrator account via the lifecycle API.`,
			},
			400,
		);
	}

	if (
		executeAt !== undefined &&
		executeAt !== null &&
		executeAt <= Date.now()
	) {
		return c.json(
			{
				error:
					"Scheduled execution time must be a future timestamp (in milliseconds).",
			},
			400,
		);
	}

	const db = createDb(c.env.DB);

	const [targetUser] = await db
		.select({
			id: users.id,
			email: users.email,
			displayName: users.displayName,
			disabledAt: users.disabledAt,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!targetUser) {
		return c.json(
			{
				error: "User not found.",
			},
			404,
		);
	}

	if (action === "disable" || action === "delete") {
		const isSoleAdmin = await isSoleAdministrator(db, userId);
		if (isSoleAdmin) {
			return c.json(
				{
					error: `Cannot ${action} the last remaining active administrator account.`,
				},
				400,
			);
		}
	}

	const now = Date.now();
	const isScheduled =
		typeof executeAt === "number" &&
		Number.isFinite(executeAt) &&
		executeAt > now;

	if (isScheduled) {
		const id = crypto.randomUUID();

		await db.insert(lifecycleActions).values({
			id,
			userId,
			action,
			executeAt,
			status: "pending",
			createdAt: now,
			updatedAt: now,
		});

		try {
			await c.env.LIFECYCLE_WORKFLOW.create({
				id,
				params: {
					lifecycleActionId: id,
				},
			});
		} catch (error) {
			await db.delete(lifecycleActions).where(eq(lifecycleActions.id, id));
			throw error;
		}

		if (action === "disable") {
			await db
				.update(users)
				.set({
					disabledAt: executeAt,
					updatedAt: now,
				})
				.where(eq(users.id, userId));
		}

		const actionVerb =
			action === "disable"
				? "Deactivation"
				: action === "delete"
					? "Deletion"
					: "Activation";
		const actionPast =
			action === "disable"
				? "disabled"
				: action === "delete"
					? "deleted"
					: "enabled";

		await emitNotification(db, {
			target: "admins",
			type: "admin.user_lifecycle",
			category: "admin",
			severity: action === "delete" ? "danger" : "warning",
			title: `User ${actionVerb} Scheduled`,
			message: `Account ${targetUser.email} is scheduled to be ${actionPast} on ${new Date(executeAt).toLocaleString()}.`,
			actionUrl: `/admin/users?userId=${encodeURIComponent(userId)}`,
		});

		return c.json(
			{
				id,
				userId,
				action,
				executeAt,
				status: "pending",
				scheduled: true,
				createdAt: now,
				updatedAt: now,
			},
			201,
		);
	}

	// Immediate execution
	if (action === "disable") {
		await disableUser(db, userId);
	} else if (action === "delete") {
		await deleteUser(db, userId, { profileBucket: c.env.PROFILE_BUCKET });
	} else {
		await enableUser(db, userId);
	}

	const actionPast =
		action === "disable"
			? "disabled"
			: action === "delete"
				? "deleted"
				: "enabled";
	const actionTitle =
		action === "disable"
			? "Disabled"
			: action === "delete"
				? "Deleted"
				: "Enabled";

	await emitNotification(db, {
		target: "admins",
		type: "admin.user_lifecycle",
		category: "admin",
		severity:
			action === "delete"
				? "danger"
				: action === "disable"
					? "warning"
					: "info",
		title: `User Account ${actionTitle}`,
		message: `Account ${targetUser.email} has been ${actionPast} by an administrator.`,
		actionUrl:
			action === "delete"
				? "/admin/users"
				: `/admin/users?userId=${encodeURIComponent(userId)}`,
	});

	return c.json(
		{
			success: true,
			userId,
			action,
			status: "completed",
			scheduled: false,
			executedAt: now,
		},
		200,
	);
});

export default route;
