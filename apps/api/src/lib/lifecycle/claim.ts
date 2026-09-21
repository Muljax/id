import { and, eq } from "drizzle-orm";

import type { Database } from "../../db";
import { lifecycleActions } from "../../db/schema";

/**
 * Atomically claims a pending lifecycle action for execution.
 *
 * Only actions currently in the `pending` state can be claimed, ensuring an
 * action can only be claimed once.
 *
 * @param db The database connection.
 * @param lifecycleActionId The ID of the lifecycle action to claim.
 * @returns The claimed action, or `null` if it does not exist or is no longer pending.
 */
export async function claimLifecycleAction(
	db: Database,
	lifecycleActionId: string,
) {
	const now = Date.now();

	const result = await db
		.update(lifecycleActions)
		.set({
			status: "processing",
			updatedAt: now,
		})
		.where(
			and(
				eq(lifecycleActions.id, lifecycleActionId),
				eq(lifecycleActions.status, "pending"),
			),
		)
		.returning();

	return result[0] ?? null;
}
