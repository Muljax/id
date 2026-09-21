import { eq } from "drizzle-orm";

import type { Database } from "../../../db";
import { users } from "../../../db/schema";

/**
 * Enables a user by clearing their disabled timestamp.
 *
 * @param db The database connection.
 * @param userId The ID of the user to enable.
 */
export async function enableUser(db: Database, userId: string) {
	await db
		.update(users)
		.set({
			disabledAt: null,
			updatedAt: Date.now(),
		})
		.where(eq(users.id, userId));
}
