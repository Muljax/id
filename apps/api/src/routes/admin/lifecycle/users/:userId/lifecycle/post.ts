import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { lifecycleActions, users } from "@/db/schema";
import { disableUser } from "@/lib/lifecycle/actions/disable";
import { enableUser } from "@/lib/lifecycle/actions/enable";
import { LIFECYCLE_ACTIONS, type LifecycleAction } from "@/lib/lifecycle/types";
import { emitNotification } from "@/lib/notifications/emitter";
import { requireAdmin } from "@/middleware/auth";

/**
 * Controls the actions allowed by the lifecycle endpoint.
 */
function isLifecycleAction(value: unknown): value is LifecycleAction {
	return (
		typeof value === "string" &&
		LIFECYCLE_ACTIONS.includes(value as LifecycleAction)
	);
}

const route = new Hono<{ Bindings: Env }>();

route.post("/", requireAdmin, async (c) => {
	const userId = c.req.param("userId");

	if (!userId) {
		return c.json(
			{
				error: "User ID is required.",
			},
			400,
		);
	}

	const body = await c.req.json<unknown>().catch(() => null);

	if (typeof body !== "object" || body === null || Array.isArray(body)) {
		return c.json(
			{
				error: "Request body must be a JSON object.",
			},
			400,
		);
	}

	const { action, executeAt } = body as {
		action?: unknown;
		executeAt?: unknown;
	};

	if (!isLifecycleAction(action)) {
		return c.json(
			{
				error: "Invalid action. Must be 'enable' or 'disable'.",
			},
			400,
		);
	}

	const currentUser = c.get("user");
	if (action === "disable" && currentUser && userId === currentUser.id) {
		return c.json(
			{
				error: "You cannot disable your own administrator account.",
			},
			400,
		);
	}

	if (
		executeAt !== undefined &&
		executeAt !== null &&
		(typeof executeAt !== "number" ||
			!Number.isFinite(executeAt) ||
			executeAt <= Date.now())
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
			isAdmin: users.isAdmin,
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

		await emitNotification(db, {
			target: "admins",
			type: "admin.user_lifecycle",
			category: "admin",
			severity: "warning",
			title: `User ${action === "disable" ? "Deactivation" : "Activation"} Scheduled`,
			message: `Account ${targetUser.email} is scheduled to be ${
				action === "disable" ? "disabled" : "enabled"
			} on ${new Date(executeAt).toLocaleString()}.`,
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
	} else {
		await enableUser(db, userId);
	}

	await emitNotification(db, {
		target: "admins",
		type: "admin.user_lifecycle",
		category: "admin",
		severity: action === "disable" ? "warning" : "info",
		title: `User Account ${action === "disable" ? "Disabled" : "Enabled"}`,
		message: `Account ${targetUser.email} has been ${
			action === "disable" ? "disabled" : "enabled"
		} by an administrator.`,
		actionUrl: `/admin/users?userId=${encodeURIComponent(userId)}`,
	});

	return c.json({
		success: true,
		userId,
		action,
		status: "completed",
		scheduled: false,
		executedAt: now,
	});
});

export default route;
