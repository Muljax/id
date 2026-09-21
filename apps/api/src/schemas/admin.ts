import { z } from "@hono/zod-openapi";
import { AuthUserSchema } from "./auth";

// --- Settings ---
export const InstanceSettingsSchema = z
	.object({
		id: z.number().openapi({ example: 1 }),
		signupMode: z
			.enum(["enabled", "invite", "disabled"])
			.openapi({ example: "enabled" }),
		signinMode: z
			.enum(["enabled", "admin_key", "disabled"])
			.openapi({ example: "enabled" }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		updatedAt: z.number().openapi({ example: 1773767800000 }),
	})
	.openapi("InstanceSettings");

export const AdminSettingsResponseSchema = z
	.object({
		settings: InstanceSettingsSchema,
	})
	.openapi("AdminSettingsResponse");

export const AdminSettingsPatchRequestSchema = z
	.object({
		signupMode: z
			.enum(["enabled", "invite", "disabled"])
			.optional()
			.openapi({ example: "invite" }),
		signinMode: z
			.enum(["enabled", "admin_key", "disabled"])
			.optional()
			.openapi({ example: "admin_key" }),
	})
	.openapi("AdminSettingsPatchRequest");

// --- Bootstrap ---
export const AdminBootstrapRequestSchema = z
	.object({
		secret: z
			.string()
			.min(1)
			.openapi({ example: "super-secure-bootstrap-secret" }),
	})
	.openapi("AdminBootstrapRequest");

// --- Permissions ---
export const PermissionSchema = z
	.object({
		id: z.string().openapi({ example: "users:read" }),
		name: z.string().openapi({ example: "Read Users" }),
		description: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "View all user accounts" }),
		resource: z.string().openapi({ example: "users" }),
		isSystem: z.boolean().openapi({ example: true }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		updatedAt: z.number().openapi({ example: 1773767800000 }),
	})
	.openapi("Permission");

export const AdminPermissionsListResponseSchema = z
	.object({
		permissions: z.array(PermissionSchema),
		categories: z.record(z.string(), z.array(PermissionSchema)),
	})
	.openapi("AdminPermissionsListResponse");

// --- Roles ---
export const RoleSchema = z
	.object({
		id: z.string().openapi({ example: "admin" }),
		name: z.string().openapi({ example: "Administrator" }),
		description: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "Super administrator role" }),
		isSystem: z.boolean().openapi({ example: true }),
		permissions: z.array(z.string()).openapi({ example: ["*"] }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		updatedAt: z.number().openapi({ example: 1773767800000 }),
	})
	.openapi("Role");

export const AdminRolesListResponseSchema = z
	.object({
		roles: z.array(RoleSchema),
	})
	.openapi("AdminRolesListResponse");

export const AdminRoleResponseSchema = z
	.object({
		role: RoleSchema,
	})
	.openapi("AdminRoleResponse");

export const CreateRoleRequestSchema = z
	.object({
		name: z.string().min(1).max(64).openapi({ example: "editor" }),
		description: z.string().optional().openapi({ example: "Content editor" }),
		permissions: z
			.array(z.string())
			.optional()
			.openapi({ example: ["docs:write"] }),
	})
	.openapi("CreateRoleRequest");

export const UpdateRoleRequestSchema = z
	.object({
		name: z.string().min(1).max(64).optional().openapi({ example: "editor" }),
		description: z
			.string()
			.optional()
			.openapi({ example: "Updated description" }),
		permissions: z
			.array(z.string())
			.optional()
			.openapi({ example: ["docs:write"] }),
	})
	.openapi("UpdateRoleRequest");

export const RolePermissionsResponseSchema = z
	.object({
		roleId: z.string().openapi({ example: "admin" }),
		permissions: z
			.array(z.string())
			.openapi({ example: ["users:read", "users:write"] }),
	})
	.openapi("RolePermissionsResponse");

export const RolePermissionsRequestSchema = z
	.object({
		permissions: z
			.array(z.string())
			.min(1)
			.openapi({ example: ["users:read"] }),
	})
	.openapi("RolePermissionsRequest");

export const SetRolePermissionsRequestSchema = z
	.object({
		permissions: z.array(z.string()).openapi({ example: ["users:read"] }),
	})
	.openapi("SetRolePermissionsRequest");

// --- Invites ---
export const AdminInviteItemSchema = z
	.object({
		id: z.string().openapi({ example: "inv_123456" }),
		email: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "new@example.com" }),
		roleId: z.string().openapi({ example: "user" }),
		createdByUserId: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "f47ac10b-..." }),
		creatorEmail: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "admin@example.com" }),
		usedByUserId: z.string().nullable().optional().openapi({ example: null }),
		usedByUserEmail: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: null }),
		expiresAt: z.number().openapi({ example: 1773854200000 }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		usedAt: z.number().nullable().optional().openapi({ example: null }),
		tokenHash: z.string().optional(),
	})
	.openapi("AdminInviteItem");

export const AdminInvitesListResponseSchema = z
	.object({
		invites: z.array(AdminInviteItemSchema),
	})
	.openapi("AdminInvitesListResponse");

export const CreateInviteRequestSchema = z
	.object({
		email: z
			.string()
			.email()
			.optional()
			.openapi({ example: "invitee@example.com" }),
		roleId: z.string().optional().openapi({ example: "user" }),
		ttlHours: z.number().positive().optional().openapi({ example: 24 }),
	})
	.openapi("CreateInviteRequest");

export const CreatedInviteSchema = z
	.object({
		id: z.string().openapi({ example: "inv_123456" }),
		token: z.string().openapi({ example: "inv_tok_secret" }),
		email: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "new@example.com" }),
		roleId: z.string().openapi({ example: "user" }),
		createdByUserId: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "f47ac10b-..." }),
		expiresAt: z.number().openapi({ example: 1773854200000 }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		inviteUrl: z
			.string()
			.openapi({ example: "https://auth.example.com/register?invite=..." }),
	})
	.openapi("CreatedInvite");

export const AdminInviteCreatedResponseSchema = z
	.object({
		invite: CreatedInviteSchema,
	})
	.openapi("AdminInviteCreatedResponse");

// --- Sign-in Keys ---
export const SigninKeySchema = z
	.object({
		id: z.string().openapi({ example: "key_12345" }),
		name: z.string().openapi({ example: "Ops Team Key" }),
		key: z.string().optional().openapi({ example: "sec_key_..." }),
		preview: z.string().optional().openapi({ example: "sec_...abcd" }),
		keyPrefix: z.string().optional().openapi({ example: "sec_...abcd" }),
		createdByUserId: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "f47ac10b-..." }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		expiresAt: z
			.number()
			.nullable()
			.optional()
			.openapi({ example: 1773854200000 }),
		lastUsedAt: z.number().nullable().optional().openapi({ example: null }),
	})
	.openapi("SigninKey");

export const AdminSigninKeysListResponseSchema = z
	.object({
		keys: z.array(SigninKeySchema),
	})
	.openapi("AdminSigninKeysListResponse");

export const CreateSigninKeyRequestSchema = z
	.object({
		name: z.string().min(1).openapi({ example: "Ops Key" }),
		ttlHours: z.number().positive().optional().openapi({ example: 48 }),
	})
	.openapi("CreateSigninKeyRequest");

export const AdminSigninKeyCreatedResponseSchema = z
	.object({
		key: SigninKeySchema,
	})
	.openapi("AdminSigninKeyCreatedResponse");

// --- Lifecycle ---
export const AdminUserLifecycleRequestSchema = z
	.object({
		action: z
			.enum(["enable", "disable", "delete"])
			.openapi({ example: "disable" }),
		executeAt: z
			.number()
			.int()
			.positive()
			.optional()
			.openapi({ example: 1773854200000 }),
	})
	.openapi("AdminUserLifecycleRequest");

export const AdminUserLifecycleResponseSchema = z
	.object({
		success: z.boolean().optional().openapi({ example: true }),
		userId: z.string().openapi({ example: "f47ac10b-..." }),
		action: z
			.enum(["enable", "disable", "delete"])
			.openapi({ example: "disable" }),
		status: z.string().openapi({ example: "completed" }),
		scheduled: z.boolean().openapi({ example: false }),
		id: z.string().optional().openapi({ example: "action_123" }),
		executeAt: z.number().optional().openapi({ example: 1773854200000 }),
		executedAt: z.number().optional().openapi({ example: 1773767800000 }),
		createdAt: z.number().optional().openapi({ example: 1773767800000 }),
		updatedAt: z.number().optional().openapi({ example: 1773767800000 }),
	})
	.openapi("AdminUserLifecycleResponse");

// --- Users ---
export const AdminUserListItemSchema = z
	.object({
		id: z.string().openapi({ example: "f47ac10b-58cc-4372-a567-0e02b2c3d479" }),
		email: z.string().email().openapi({ example: "alice@example.com" }),
		displayName: z.string().nullable().openapi({ example: "Alice Smith" }),
		givenName: z.string().nullable().openapi({ example: "Alice" }),
		familyName: z.string().nullable().openapi({ example: "Smith" }),
		middleName: z.string().nullable().openapi({ example: null }),
		nickname: z.string().nullable().openapi({ example: "ali" }),
		preferredUsername: z.string().nullable().openapi({ example: "alice" }),
		profileUrl: z.string().nullable().openapi({ example: null }),
		profileImageKey: z.string().nullable().openapi({ example: null }),
		website: z.string().nullable().openapi({ example: null }),
		gender: z.string().nullable().openapi({ example: null }),
		birthdate: z.string().nullable().openapi({ example: null }),
		zoneinfo: z.string().nullable().openapi({ example: null }),
		locale: z.string().nullable().openapi({ example: null }),
		emailVerifiedAt: z.number().nullable().openapi({ example: null }),
		disabledAt: z.number().nullable().optional().openapi({ example: null }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		updatedAt: z.number().openapi({ example: 1773767800000 }),
		roles: z.array(z.string()).openapi({ example: ["Administrator"] }),
		roleIds: z.array(z.string()).openapi({ example: ["admin"] }),
	})
	.openapi("AdminUserListItem");

export const AdminUsersListResponseSchema = z
	.object({
		users: z.array(AdminUserListItemSchema),
	})
	.openapi("AdminUsersListResponse");

export const CreateUserRequestSchema = z
	.object({
		email: z.string().email().openapi({ example: "newuser@example.com" }),
		password: z.string().min(8).optional().openapi({ example: "Password123!" }),
		roleId: z.string().optional().openapi({ example: "user" }),
	})
	.openapi("CreateUserRequest");

export const CreateUserResponseSchema = z
	.object({
		user: AuthUserSchema,
		temporaryPassword: z
			.string()
			.nullable()
			.openapi({ example: "temp_pass_123" }),
	})
	.openapi("CreateUserResponse");

export const DeleteUserResponseSchema = z
	.object({
		success: z.boolean().openapi({ example: true }),
		userId: z.string().openapi({ example: "f47ac10b-..." }),
	})
	.openapi("DeleteUserResponse");

export const PasswordResetLinkResponseSchema = z
	.object({
		token: z.string().openapi({ example: "rst_tok_123" }),
		resetUrl: z.string().openapi({
			example: "https://auth.example.com/reset-password?token=rst_tok_123",
		}),
		expiresAt: z.number().openapi({ example: 1773854200000 }),
	})
	.openapi("PasswordResetLinkResponse");

export const UserPermissionsResponseSchema = z
	.object({
		userId: z.string().openapi({ example: "f47ac10b-..." }),
		email: z.string().openapi({ example: "alice@example.com" }),
		roles: z.array(z.string()).openapi({ example: ["admin"] }),
		permissions: z.array(z.string()).openapi({ example: ["*"] }),
	})
	.openapi("UserPermissionsResponse");

export const UserRoleDetailedSchema = z
	.object({
		roleId: z.string().openapi({ example: "admin" }),
		roleName: z.string().openapi({ example: "Administrator" }),
		description: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "Super admin role" }),
		isSystem: z.boolean().openapi({ example: true }),
		assignedAt: z.number().openapi({ example: 1773767800000 }),
		assignedBy: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "f47ac10b-..." }),
	})
	.openapi("UserRoleDetailed");

export const UserRolesResponseSchema = z
	.object({
		userId: z.string().openapi({ example: "f47ac10b-..." }),
		email: z.string().optional().openapi({ example: "alice@example.com" }),
		roles: z.array(UserRoleDetailedSchema),
	})
	.openapi("UserRolesResponse");

export const AssignUserRoleRequestSchema = z
	.object({
		roleId: z.string().min(1).openapi({ example: "admin" }),
	})
	.openapi("AssignUserRoleRequest");

export const SetUserRolesRequestSchema = z
	.object({
		roleIds: z.array(z.string()).openapi({ example: ["admin", "user"] }),
	})
	.openapi("SetUserRolesRequest");

export const AdminSessionItemSchema = z
	.object({
		id: z.string().openapi({ example: "sess_uuid_1234" }),
		ipAddress: z.string().nullable().openapi({ example: "198.51.100.42" }),
		country: z.string().nullable().openapi({ example: "US" }),
		city: z.string().nullable().openapi({ example: "Chicago" }),
		region: z.string().nullable().openapi({ example: "IL" }),
		latitude: z.number().nullable().openapi({ example: 41.8781 }),
		longitude: z.number().nullable().openapi({ example: -87.6298 }),
		browser: z.string().nullable().openapi({ example: "Chrome 124" }),
		os: z.string().nullable().openapi({ example: "macOS 14.4" }),
		expiresAt: z.number().openapi({ example: 1773854200000 }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
	})
	.openapi("AdminSessionItem");

export const AdminUserSessionsResponseSchema = z
	.object({
		userId: z.string().openapi({ example: "f47ac10b-..." }),
		sessions: z.array(AdminSessionItemSchema),
	})
	.openapi("AdminUserSessionsResponse");

export type UsersResponse = z.infer<typeof AdminUsersListResponseSchema>;
export type AdminUser = UsersResponse["users"][number];
export type PasswordResetLinkResponse = z.infer<
	typeof PasswordResetLinkResponseSchema
>;
export type UserLifecycleResponse = z.infer<
	typeof AdminUserLifecycleResponseSchema
>;
export type AdminUserSessionsResponse = z.infer<
	typeof AdminUserSessionsResponseSchema
>;
export type RolesResponse = z.infer<typeof AdminRolesListResponseSchema>;
export type RoleResponse = z.infer<typeof AdminRoleResponseSchema>;
export type Role = RoleResponse["role"];
export type PermissionsResponse = z.infer<
	typeof AdminPermissionsListResponseSchema
>;
export type Permission = PermissionsResponse["permissions"][number];
export type UserRolesResponse = z.infer<typeof UserRolesResponseSchema>;
export type UserRoleItem = UserRolesResponse["roles"][number];
export type UserPermissionsResponse = z.infer<
	typeof UserPermissionsResponseSchema
>;
export type AdminInvite = z.infer<typeof AdminInviteItemSchema>;
export type CreateInviteResponse = z.infer<
	typeof AdminInviteCreatedResponseSchema
>;
export type AdminSigninKey = z.infer<typeof SigninKeySchema>;
export type CreateSigninKeyResponse = z.infer<
	typeof AdminSigninKeyCreatedResponseSchema
>;
export type InstanceSettings = z.infer<typeof InstanceSettingsSchema>;
export type AdminInstanceSettings = InstanceSettings;
export type SettingsResponse = z.infer<typeof AdminSettingsResponseSchema>;
export type LifecycleAction = "enable" | "disable" | "delete";
export interface UserLifecycleOptions {
	action: LifecycleAction;
	executeAt?: number | null;
}
