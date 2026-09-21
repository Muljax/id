import { eq } from "drizzle-orm";

import type { Database } from "../../../db";
import { users } from "../../../db/schema";

/**
 * Permanently deletes a user and removes associated remote storage assets.
 * Cascades delete across all database tables referencing the user ID.
 *
 * @param db The database connection.
 * @param userId The ID of the user to delete.
 * @param options Storage bucket options for profile asset cleanup.
 */
export async function deleteUser(
	db: Database,
	userId: string,
	options?: { profileBucket?: R2Bucket },
) {
	const [user] = await db
		.select({
			id: users.id,
			profileImageKey: users.profileImageKey,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!user) {
		return;
	}

	if (user.profileImageKey && options?.profileBucket) {
		try {
			await options.profileBucket.delete(user.profileImageKey);
		} catch {}
	}

	await db.delete(users).where(eq(users.id, userId));
}
