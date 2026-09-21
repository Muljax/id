import { describe, expect, test } from "bun:test";
import * as schema from "../src/db/schema";
import {
	hasAllPermissions,
	hasAnyPermission,
	hasPermission,
} from "../src/lib/rbac/matcher";
import {
	addRolePermissions,
	assignUserRole,
	canUserAssignRoles,
	canUserGrantPermissions,
	createRole,
	deleteRole,
	getRole,
	getUserRolesDetailed,
	listAllPermissions,
	listRoles,
	removeRolePermission,
	revokeUserRole,
	setRolePermissions,
	setUserRoles,
	updateRole,
} from "../src/lib/rbac/roles";
import { SYSTEM_ROLE_IDS } from "../src/lib/rbac/constants";
import { createTestAdminUser, createTestDb, createTestUser } from "./helpers";

describe("RBAC Permissions & Ceiling Hardening", () => {
	test("hierarchical wildcards match multi-level permissions", () => {
		const perms = new Set(["ssh:cert:*"]);
		expect(hasPermission(perms, "ssh:cert:issue")).toBe(true);
		expect(hasPermission(perms, "ssh:cert:revoke")).toBe(true);
		expect(hasPermission(perms, "ssh:keys:manage")).toBe(false);

		const globalSsh = new Set(["ssh:*"]);
		expect(hasPermission(globalSsh, "ssh:cert:issue")).toBe(true);
		expect(hasPermission(globalSsh, "ssh:keys:manage")).toBe(true);
		expect(hasPermission(globalSsh, "users:read")).toBe(false);

		const superadmin = new Set(["*"]);
		expect(hasPermission(superadmin, "ssh:cert:issue")).toBe(true);
		expect(hasPermission(superadmin, "users:write")).toBe(true);
	});

	test("canUserGrantPermissions enforces permission ceiling", () => {
		const regularAdmin = new Set(["users:read", "users:write", "roles:read"]);
		// Cannot grant permissions caller does not have
		expect(
			canUserGrantPermissions(regularAdmin, ["users:read", "settings:write"]),
		).toBe(false);
		expect(canUserGrantPermissions(regularAdmin, ["*"])).toBe(false);
		expect(canUserGrantPermissions(regularAdmin, ["roles:*"])).toBe(false);

		// Can grant permissions caller has
		expect(
			canUserGrantPermissions(regularAdmin, ["users:read", "users:write"]),
		).toBe(true);

		// Wildcard permissions satisfy specific grants
		const userAdmin = new Set(["users:*"]);
		expect(
			canUserGrantPermissions(userAdmin, [
				"users:read",
				"users:write",
				"users:delete",
			]),
		).toBe(true);
		expect(canUserGrantPermissions(userAdmin, ["ssh:keys:manage"])).toBe(false);

		// Superadmin can grant anything
		const superAdmin = new Set(["*"]);
		expect(
			canUserGrantPermissions(superAdmin, ["settings:write", "users:*", "*"]),
		).toBe(true);
	});

	test("ssh:principal permissions are strictly isolated and prevent privilege escalation", () => {
		const deployPrincipal = new Set(["ssh:principal:deploy"]);
		// Matches its own principal claim
		expect(hasPermission(deployPrincipal, "ssh:principal:deploy")).toBe(true);
		// Does NOT match other principals
		expect(hasPermission(deployPrincipal, "ssh:principal:root")).toBe(false);
		expect(hasPermission(deployPrincipal, "ssh:principal:admin")).toBe(false);
		// Does NOT grant certificate issuance or key management
		expect(hasPermission(deployPrincipal, "ssh:cert:issue")).toBe(false);
		expect(hasPermission(deployPrincipal, "ssh:keys:manage")).toBe(false);
		expect(hasPermission(deployPrincipal, "ssh:ca:read")).toBe(false);
		expect(hasPermission(deployPrincipal, "ssh:*")).toBe(false);
		expect(hasPermission(deployPrincipal, "users:read")).toBe(false);

		const wildcardPrincipal = new Set(["ssh:principal:*"]);
		// Matches any principal claim
		expect(hasPermission(wildcardPrincipal, "ssh:principal:deploy")).toBe(true);
		expect(hasPermission(wildcardPrincipal, "ssh:principal:root")).toBe(true);
		expect(hasPermission(wildcardPrincipal, "ssh:principal:custom-user")).toBe(
			true,
		);
		// Does NOT grant any other SSH operations
		expect(hasPermission(wildcardPrincipal, "ssh:cert:issue")).toBe(false);
		expect(hasPermission(wildcardPrincipal, "ssh:keys:manage")).toBe(false);
		expect(hasPermission(wildcardPrincipal, "ssh:cert:revoke")).toBe(false);
		expect(hasPermission(wildcardPrincipal, "ssh:*")).toBe(false);
		// Does NOT grant system access
		expect(hasPermission(wildcardPrincipal, "users:*")).toBe(false);
		expect(hasPermission(wildcardPrincipal, "*")).toBe(false);

		// Admin SSH permission satisfies all principal checks
		const fullSsh = new Set(["ssh:*"]);
		expect(hasPermission(fullSsh, "ssh:principal:deploy")).toBe(true);
		expect(hasPermission(fullSsh, "ssh:principal:root")).toBe(true);
		expect(hasPermission(fullSsh, "ssh:principal:*")).toBe(true);
	});

	test("hasAllPermissions and hasAnyPermission evaluate permission combinations", () => {
		const perms = new Set(["users:read", "users:write", "settings:read"]);

		expect(hasAllPermissions(perms, ["users:read", "settings:read"])).toBe(
			true,
		);
		expect(hasAllPermissions(perms, ["users:read", "ssh:cert:issue"])).toBe(
			false,
		);

		expect(hasAnyPermission(perms, ["ssh:cert:issue", "users:read"])).toBe(
			true,
		);
		expect(hasAnyPermission(perms, ["ssh:cert:issue", "roles:write"])).toBe(
			false,
		);
	});
});

describe("RBAC Database Role Management & Assignments", () => {
	test("createRole, getRole, listRoles, updateRole, and deleteRole lifecycle", async () => {
		const { db } = createTestDb();
		const now = Date.now();

		await db.insert(schema.permissions).values([
			{
				id: "users:read",
				name: "Users Read",
				resource: "users",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: "users:write",
				name: "Users Write",
				resource: "users",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
		]);

		// Create role with permissions
		const role = await createRole(db, {
			name: "Auditor",
			description: "Audits users and settings",
			permissions: ["users:read"],
		});

		expect(role).not.toBeNull();
		expect(role?.name).toBe("Auditor");
		expect(role?.permissions).toEqual(["users:read"]);

		// Get role
		const fetched = await getRole(db, role!.id);
		expect(fetched?.id).toBe(role?.id);

		// List roles
		const all = await listRoles(db);
		expect(all.some((r) => r.id === role?.id)).toBe(true);

		// Update role name and permissions
		const updated = await updateRole(db, role!.id, {
			name: "Senior Auditor",
			permissions: ["users:read", "users:write"],
		});
		expect(updated?.name).toBe("Senior Auditor");
		expect(updated?.permissions).toContain("users:write");

		// Delete role
		const delResult = await deleteRole(db, role!.id);
		expect(delResult.success).toBe(true);
		expect(await getRole(db, role!.id)).toBeNull();
	});

	test("System roles cannot be deleted or have permissions modified", async () => {
		const { db } = createTestDb();
		const now = Date.now();

		await db.insert(schema.roles).values({
			id: SYSTEM_ROLE_IDS.ADMIN,
			name: "Administrator",
			isSystem: true,
			createdAt: now,
			updatedAt: now,
		});

		const delResult = await deleteRole(db, SYSTEM_ROLE_IDS.ADMIN);
		expect(delResult.success).toBe(false);
		expect(delResult.error).toContain("System roles cannot be deleted");

		expect(
			setRolePermissions(db, SYSTEM_ROLE_IDS.ADMIN, ["users:read"]),
		).rejects.toThrow("System role permissions cannot be modified");
	});

	test("addRolePermissions, removeRolePermission, and 'everyone' role restrictions", async () => {
		const { db } = createTestDb();
		const now = Date.now();

		await db.insert(schema.permissions).values([
			{
				id: "ssh:ca:read",
				name: "SSH CA Read",
				resource: "ssh",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: "users:write",
				name: "Users Write",
				resource: "users",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
		]);

		await db.insert(schema.roles).values({
			id: SYSTEM_ROLE_IDS.EVERYONE,
			name: "Everyone",
			isSystem: true,
			createdAt: now,
			updatedAt: now,
		});

		// Everyone role allows adding read-only permissions
		await addRolePermissions(db, SYSTEM_ROLE_IDS.EVERYONE, ["ssh:ca:read"]);
		let role = await getRole(db, SYSTEM_ROLE_IDS.EVERYONE);
		expect(role?.permissions).toContain("ssh:ca:read");

		// Everyone role rejects non-read permissions
		expect(
			addRolePermissions(db, SYSTEM_ROLE_IDS.EVERYONE, ["users:write"]),
		).rejects.toThrow(
			"The 'everyone' role can only be assigned read-only permissions",
		);

		// Remove permission
		await removeRolePermission(db, SYSTEM_ROLE_IDS.EVERYONE, "ssh:ca:read");
		role = await getRole(db, SYSTEM_ROLE_IDS.EVERYONE);
		expect(role?.permissions).not.toContain("ssh:ca:read");
	});

	test("User role assignment: setUserRoles, assignUserRole, revokeUserRole", async () => {
		const { db } = createTestDb();
		const now = Date.now();
		const { id: userId } = await createTestUser(db, {
			email: "assigned@example.com",
		});
		const { id: adminId } = await createTestAdminUser(db, {
			email: "admin-assigner@example.com",
		});

		await db.insert(schema.roles).values([
			{
				id: "role-a",
				name: "Role A",
				isSystem: false,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: "role-b",
				name: "Role B",
				isSystem: false,
				createdAt: now,
				updatedAt: now,
			},
		]);

		// Assign role
		await assignUserRole(db, userId, "role-a", adminId);
		let userRoles = await getUserRolesDetailed(db, userId);
		expect(userRoles).toHaveLength(1);
		expect(userRoles[0].roleId).toBe("role-a");
		expect(userRoles[0].assignedBy).toBe(adminId);

		// Set multiple roles
		await setUserRoles(db, userId, ["role-a", "role-b"]);
		userRoles = await getUserRolesDetailed(db, userId);
		expect(userRoles).toHaveLength(2);

		// Revoke single role
		await revokeUserRole(db, userId, "role-a");
		userRoles = await getUserRolesDetailed(db, userId);
		expect(userRoles).toHaveLength(1);
		expect(userRoles[0].roleId).toBe("role-b");

		// Reject assigning everyone role manually
		expect(
			assignUserRole(db, userId, SYSTEM_ROLE_IDS.EVERYONE),
		).rejects.toThrow();
	});

	test("canUserAssignRoles enforces permission ceiling", async () => {
		const { db } = createTestDb();
		const now = Date.now();

		await db.insert(schema.permissions).values([
			{
				id: "settings:write",
				name: "Settings Write",
				resource: "settings",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
		]);

		await db.insert(schema.roles).values({
			id: "role-powerful",
			name: "Powerful Role",
			isSystem: false,
			createdAt: now,
			updatedAt: now,
		});

		await db.insert(schema.rolePermissions).values({
			roleId: "role-powerful",
			permissionId: "settings:write",
			createdAt: now,
		});

		// Caller has only users:* permission
		const callerPerms = new Set(["users:*"]);
		const check = await canUserAssignRoles(db, callerPerms, ["role-powerful"]);
		expect(check.allowed).toBe(false);
		expect(check.missingPermissions).toContain("settings:write");

		// Superadmin can assign any role
		const superadminPerms = new Set(["*"]);
		const superCheck = await canUserAssignRoles(db, superadminPerms, [
			"role-powerful",
		]);
		expect(superCheck.allowed).toBe(true);
	});

	test("listAllPermissions retrieves all registered system and custom permissions", async () => {
		const { db } = createTestDb();
		const now = Date.now();

		await db.insert(schema.permissions).values([
			{
				id: "ssh:cert:issue",
				name: "Issue Cert",
				resource: "ssh",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: "users:read",
				name: "Read Users",
				resource: "users",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
		]);

		const all = await listAllPermissions(db);
		expect(all).toHaveLength(2);
	});
});
