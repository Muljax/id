import { and, eq, gt } from "drizzle-orm";

import type { Database } from "../../db";
import { lifecycleActions } from "../../db/schema";
import { deleteUser } from "./actions/delete";
import { disableUser } from "./actions/disable";
import { enableUser } from "./actions/enable";

/**
 * Executes a lifecycle action for a user.
 *
 * An action is skipped when a newer action of the same type is already
 * scheduled for the same user.
 *
 * @param db The database connection.
 * @param action The lifecycle action to execute.
 * @param options Storage options for resource cleanup.
 * @returns `true` when the action is executed, or `false` when it is skipped.
 * @throws If the lifecycle action type is invalid.
 */
export async function executeLifecycleAction(
	db: Database,
	action: typeof lifecycleActions.$inferSelect,
	options?: { profileBucket?: R2Bucket },
) {
	const newerAction = await db
		.select({ id: lifecycleActions.id })
		.from(lifecycleActions)
		.where(
			and(
				eq(lifecycleActions.userId, action.userId),
				eq(lifecycleActions.action, action.action),
				gt(lifecycleActions.executeAt, action.executeAt),
			),
		)
		.limit(1);

	if (newerAction[0]) {
		return false;
	}

	switch (action.action) {
		case "disable":
			await disableUser(db, action.userId);
			return true;

		case "enable":
			await enableUser(db, action.userId);
			return true;

		case "delete":
			await deleteUser(db, action.userId, options);
			return true;

		default:
			throw new Error(`Invalid lifecycle action: ${action.action}`);
	}
}
