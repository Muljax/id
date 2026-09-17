export interface PermissionDefinition {
	id: string;
	name: string;
	description: string;
	resource:
		| "system"
		| "users"
		| "roles"
		| "oauth_clients"
		| "notifications"
		| "settings"
		| "ssh";
}

export const SYSTEM_PERMISSIONS: readonly PermissionDefinition[] = [
	{
		id: "*",
		name: "All Permissions",
		description: "Full superadministrator access across the entire platform",
		resource: "system",
	},
	{
		id: "users:read",
		name: "Read Users",
		description: "View user profiles and list users",
		resource: "users",
	},
	{
		id: "users:write",
		name: "Write Users",
		description: "Create and modify user profiles",
		resource: "users",
	},
	{
		id: "users:delete",
		name: "Delete Users",
		description: "Permanently delete user accounts",
		resource: "users",
	},
	{
		id: "users:lifecycle",
		name: "Manage User Lifecycle",
		description: "Enable, disable, and schedule deactivation of user accounts",
		resource: "users",
	},
	{
		id: "users:password-reset",
		name: "Generate Password Reset Links",
		description: "Generate password reset tokens and links for users",
		resource: "users",
	},
	{
		id: "users:*",
		name: "All User Permissions",
		description: "Full control over user accounts and lifecycle",
		resource: "users",
	},
	{
		id: "roles:read",
		name: "Read Roles",
		description: "View roles and their assigned permissions",
		resource: "roles",
	},
	{
		id: "roles:write",
		name: "Write Roles",
		description: "Create, update, and delete roles and role permissions",
		resource: "roles",
	},
	{
		id: "roles:assign",
		name: "Assign Roles",
		description: "Assign and revoke roles to and from users",
		resource: "roles",
	},
	{
		id: "permissions:read",
		name: "Read Permissions",
		description: "View the system permissions catalog",
		resource: "roles",
	},
	{
		id: "roles:*",
		name: "All Role Permissions",
		description: "Full control over roles and permission assignments",
		resource: "roles",
	},
	{
		id: "oauth_clients:read",
		name: "Read OAuth Clients",
		description: "View registered OAuth clients and their configuration",
		resource: "oauth_clients",
	},
	{
		id: "oauth_clients:write",
		name: "Write OAuth Clients",
		description: "Create, update, rotate secrets, and delete OAuth clients",
		resource: "oauth_clients",
	},
	{
		id: "oauth_clients:*",
		name: "All OAuth Client Permissions",
		description: "Full control over OAuth applications",
		resource: "oauth_clients",
	},
	{
		id: "notifications:read",
		name: "Read Notifications",
		description: "View notifications and system alerts",
		resource: "notifications",
	},
	{
		id: "notifications:write",
		name: "Write Notifications",
		description: "Dismiss, mark read, or emit notifications",
		resource: "notifications",
	},
	{
		id: "settings:read",
		name: "Read Settings",
		description: "View tenant and instance configuration",
		resource: "settings",
	},
	{
		id: "settings:write",
		name: "Write Settings",
		description: "Modify tenant and instance configuration",
		resource: "settings",
	},
	{
		id: "ssh:keys:manage",
		name: "Manage Personal SSH Keys",
		description: "Register, view, and delete personal SSH public keys",
		resource: "ssh",
	},
	{
		id: "ssh:cert:issue",
		name: "Issue Personal SSH Certificates",
		description: "Request and generate signed SSH user certificates",
		resource: "ssh",
	},
	{
		id: "ssh:ca:read",
		name: "Read SSH CA Info",
		description: "View SSH CA public keys, fingerprints, and revocation lists",
		resource: "ssh",
	},
	{
		id: "ssh:cert:list",
		name: "List All SSH Certificates",
		description:
			"View global history and audit logs of issued SSH certificates across all users",
		resource: "ssh",
	},
	{
		id: "ssh:cert:revoke",
		name: "Revoke SSH Certificates",
		description:
			"Revoke active OpenSSH certificates and update revocation lists",
		resource: "ssh",
	},
	{
		id: "ssh:keys:admin",
		name: "Manage All User SSH Keys",
		description: "View and delete SSH public keys belonging to any user",
		resource: "ssh",
	},
	{
		id: "ssh:*",
		name: "All SSH Permissions",
		description:
			"Full administrative control over SSH CA, keys, certificates, and revocation",
		resource: "ssh",
	},
] as const;

export const SYSTEM_ROLE_IDS = {
	ADMIN: "admin",
	USER: "user",
	EVERYONE: "everyone",
} as const;

export const DEFAULT_ROLES = [
	{
		id: SYSTEM_ROLE_IDS.ADMIN,
		name: "Administrator",
		description: "Superadministrator with unrestricted access to all resources",
		isSystem: true,
		permissions: ["*"],
	},
	{
		id: SYSTEM_ROLE_IDS.USER,
		name: "User",
		description: "Standard user with basic self-service access",
		isSystem: true,
		permissions: ["ssh:cert:issue", "ssh:keys:manage", "ssh:ca:read"],
	},
	{
		id: SYSTEM_ROLE_IDS.EVERYONE,
		name: "Everyone",
		description:
			"Universal role granted to all callers, authenticated or not (strictly read-only)",
		isSystem: true,
		permissions: ["ssh:ca:read"],
	},
] as const;

/**
 * Determines whether a permission is strictly read-only.
 * The 'everyone' role can only be assigned read-only permissions.
 */
export function isReadOnlyPermission(permissionId: string): boolean {
	return permissionId.endsWith(":read");
}
