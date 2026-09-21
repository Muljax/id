import { describe, expect, test } from "bun:test";
import * as schema from "../src/db/schema";
import { SYSTEM_ROLE_IDS } from "../src/lib/rbac/constants";
import { getUsers, isUserDisabled, toAuthUser } from "../src/lib/user";
import { createTestDb, createTestUser, seedTestSystemRoles } from "./helpers";

describe("User Model & Serialization Utilities", () => {
	test("isUserDisabled correctly identifies user disabled status", () => {
		expect(isUserDisabled(null)).toBe(false);
		expect(isUserDisabled(undefined)).toBe(false);
		expect(isUserDisabled({ disabledAt: null })).toBe(false);
		expect(isUserDisabled({ disabledAt: Date.now() - 1000 })).toBe(true);
		expect(isUserDisabled({ disabledAt: Date.now() + 100000 })).toBe(false); // Future timestamp is scheduled
	});

	test("getUsers returns formatted users and maps assigned roles", async () => {
		const { db } = createTestDb();
		const now = Date.now();

		expect(await getUsers(db)).toEqual([]);

		const u1 = await createTestUser(db, {
			email: "user1@example.com",
			displayName: "Alice",
		});
		const u2 = await createTestUser(db, {
			email: "user2@example.com",
			displayName: "Bob",
		});

		await db.insert(schema.roles).values({
			id: "custom-role-1",
			name: "Editor",
			isSystem: false,
			createdAt: now,
			updatedAt: now,
		});

		await db.insert(schema.userRoles).values({
			userId: u1.id,
			roleId: "custom-role-1",
			assignedAt: now,
		});

		const users = await getUsers(db);
		expect(users).toHaveLength(2);

		const foundU1 = users.find((u) => u.id === u1.id);
		expect(foundU1?.roles).toEqual(["Editor"]);
		expect(foundU1?.roleIds).toEqual(["custom-role-1"]);

		const foundU2 = users.find((u) => u.id === u2.id);
		expect(foundU2?.roles).toEqual([]);
		expect(foundU2?.roleIds).toEqual([]);
	});

	test("toAuthUser formats user with effective permissions and roles", async () => {
		const { db } = createTestDb();
		await seedTestSystemRoles(db);

		const [userRecord] = await db
			.insert(schema.users)
			.values({
				id: "admin-u",
				email: "admin@example.com",
				passwordHash: "hash",
				displayName: "Admin User",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			})
			.returning();

		await db.insert(schema.userRoles).values({
			userId: "admin-u",
			roleId: SYSTEM_ROLE_IDS.ADMIN,
			assignedAt: Date.now(),
		});

		const authUser = await toAuthUser(db, userRecord);
		expect(authUser.id).toBe("admin-u");
		expect(authUser.email).toBe("admin@example.com");
		expect(authUser.roles).toContain(SYSTEM_ROLE_IDS.ADMIN);
		expect(authUser.roles).toContain(SYSTEM_ROLE_IDS.EVERYONE);
		expect(authUser.permissions).toContain("*");
		expect(authUser.permissions).toContain("ssh:ca:read");
	});
});
