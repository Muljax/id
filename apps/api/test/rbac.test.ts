import { describe, expect, test } from "bun:test";
import { hasPermission } from "../src/lib/rbac/matcher";
import { canUserGrantPermissions } from "../src/lib/rbac/roles";

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
});
