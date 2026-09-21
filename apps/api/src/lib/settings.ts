import { eq } from "drizzle-orm";

import type { Database } from "@/db";
import {
	type InstanceSettings,
	instanceSettings,
	type SigninMode,
	type SignupMode,
} from "@/db/schema/instanceSettings";

/**
 * Retrieves the singleton instance settings row (id = 1),
 * or creates it with defaults if not already present.
 */
export async function getOrCreateInstanceSettings(
	db: Database,
): Promise<InstanceSettings> {
	const rows = await db
		.select()
		.from(instanceSettings)
		.where(eq(instanceSettings.id, 1))
		.limit(1);

	if (rows.length > 0) {
		return rows[0];
	}

	const now = Date.now();
	await db
		.insert(instanceSettings)
		.values({
			id: 1,
			signupMode: "enabled",
			signinMode: "enabled",
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing();

	const created = await db
		.select()
		.from(instanceSettings)
		.where(eq(instanceSettings.id, 1))
		.limit(1);

	return created[0];
}

/**
 * Updates the instance configuration settings.
 */
export async function updateInstanceSettings(
	db: Database,
	updates: {
		signupMode?: SignupMode;
		signinMode?: SigninMode;
	},
): Promise<InstanceSettings> {
	await getOrCreateInstanceSettings(db);

	const now = Date.now();
	const setValues: Partial<typeof instanceSettings.$inferInsert> = {
		updatedAt: now,
	};

	if (updates.signupMode !== undefined) {
		setValues.signupMode = updates.signupMode;
	}
	if (updates.signinMode !== undefined) {
		setValues.signinMode = updates.signinMode;
	}

	await db
		.update(instanceSettings)
		.set(setValues)
		.where(eq(instanceSettings.id, 1));

	const rows = await db
		.select()
		.from(instanceSettings)
		.where(eq(instanceSettings.id, 1))
		.limit(1);

	return rows[0];
}
