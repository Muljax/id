import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import * as schema from "../src/db/schema";
import { deleteUser } from "../src/lib/lifecycle/actions/delete";
import { executeLifecycleAction } from "../src/lib/lifecycle/engine";
import { isSoleAdministrator } from "../src/lib/rbac/permissions";
import { SYSTEM_ROLE_IDS } from "../src/lib/rbac/constants";
import { createTestDb, createTestUser } from "./helpers";

describe("Account Deletion & Lifecycle Action Engine", () => {
	test("deleteUser deletes user record and cascades to sessions and roles", async () => {
		const { db } = createTestDb();
		const now = Date.now();
		const userId = "user-to-delete";

		await db.insert(schema.users).values({
			id: userId,
			email: "delete-me@example.com",
			passwordHash: "hash",
			profileImageKey: "avatar_delete_key.png",
			createdAt: now,
			updatedAt: now,
		});

		await db.insert(schema.sessions).values({
			id: "session-1",
			userId,
			tokenHash: "session-hash-1",
			expiresAt: now + 3600000,
			createdAt: now,
		});

		let deletedBucketKey: string | null = null;
		const mockProfileBucket = {
			delete: async (key: string) => {
				deletedBucketKey = key;
			},
		} as unknown as R2Bucket;

		await deleteUser(db, userId, { profileBucket: mockProfileBucket });

		expect(deletedBucketKey).toBe("avatar_delete_key.png");

		const userRows = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, userId));
		expect(userRows).toHaveLength(0);

		const sessionRows = await db
			.select()
			.from(schema.sessions)
			.where(eq(schema.sessions.userId, userId));
		expect(sessionRows).toHaveLength(0);
	});

	test("executeLifecycleAction executes delete, disable, and enable actions", async () => {
		const { db } = createTestDb();
		const now = Date.now();
		const { id: userId } = await createTestUser(db, {
			email: "lifecycle@example.com",
		});

		// 1. Disable
		const disableAction: typeof schema.lifecycleActions.$inferSelect = {
			id: "action-1",
			userId,
			action: "disable",
			executeAt: now,
			status: "processing",
			createdAt: now,
			updatedAt: now,
			executedAt: null,
			cancelledAt: null,
			error: null,
		};
		const disableResult = await executeLifecycleAction(db, disableAction);
		expect(disableResult).toBe(true);

		let [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, userId));
		expect(user.disabledAt).not.toBeNull();

		// 2. Enable
		const enableAction: typeof schema.lifecycleActions.$inferSelect = {
			id: "action-2",
			userId,
			action: "enable",
			executeAt: now,
			status: "processing",
			createdAt: now,
			updatedAt: now,
			executedAt: null,
			cancelledAt: null,
			error: null,
		};
		const enableResult = await executeLifecycleAction(db, enableAction);
		expect(enableResult).toBe(true);

		[user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, userId));
		expect(user.disabledAt).toBeNull();

		// 3. Delete
		const deleteAction: typeof schema.lifecycleActions.$inferSelect = {
			id: "action-3",
			userId,
			action: "delete",
			executeAt: now,
			status: "processing",
			createdAt: now,
			updatedAt: now,
			executedAt: null,
			cancelledAt: null,
			error: null,
		};
		const deleteResult = await executeLifecycleAction(db, deleteAction);
		expect(deleteResult).toBe(true);

		const remainingUsers = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, userId));
		expect(remainingUsers).toHaveLength(0);
	});

	test("isSoleAdministrator accurately prevents deleting the last active admin", async () => {
		const { db } = createTestDb();
		const now = Date.now();

		await db.insert(schema.roles).values({
			id: SYSTEM_ROLE_IDS.ADMIN,
			name: "Administrator",
			isSystem: true,
			createdAt: now,
			updatedAt: now,
		});

		await db.insert(schema.users).values([
			{
				id: "admin-1",
				email: "admin1@example.com",
				passwordHash: "hash",
				createdAt: now,
				updatedAt: now,
			},
			{
				id: "user-regular",
				email: "regular@example.com",
				passwordHash: "hash",
				createdAt: now,
				updatedAt: now,
			},
		]);

		await db.insert(schema.userRoles).values({
			userId: "admin-1",
			roleId: SYSTEM_ROLE_IDS.ADMIN,
			assignedAt: now,
		});

		// Regular user is not admin
		expect(await isSoleAdministrator(db, "user-regular")).toBe(false);

		// Admin-1 is the sole admin
		expect(await isSoleAdministrator(db, "admin-1")).toBe(true);

		// Add a second admin
		await db.insert(schema.users).values({
			id: "admin-2",
			email: "admin2@example.com",
			passwordHash: "hash",
			createdAt: now,
			updatedAt: now,
		});
		await db.insert(schema.userRoles).values({
			userId: "admin-2",
			roleId: SYSTEM_ROLE_IDS.ADMIN,
			assignedAt: now,
		});

		// Now neither is the sole admin
		expect(await isSoleAdministrator(db, "admin-1")).toBe(false);
		expect(await isSoleAdministrator(db, "admin-2")).toBe(false);
	});
});
