import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { users } from "./users";

/**
 * Authorization roles defining permission bundles assigned to users.
 */
export const roles = sqliteTable("roles", {
	/**
	 * Unique machine identifier for the role (e.g. 'admin', 'user', 'auditor').
	 */
	id: text("id").primaryKey(),

	/**
	 * Display name of the role (e.g. 'Administrator', 'Standard User').
	 */
	name: text("name").notNull().unique(),

	/**
	 * Detailed summary of the privileges and audience for this role.
	 */
	description: text("description"),

	/**
	 * Flag indicating whether this is a protected immutable system role.
	 */
	isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),

	/**
	 * Epoch timestamp (ms) when the role was created.
	 */
	createdAt: integer("created_at").notNull(),

	/**
	 * Epoch timestamp (ms) when the role was last updated.
	 */
	updatedAt: integer("updated_at").notNull(),
});

/**
 * Granular platform permissions controlling access to specific resources and actions.
 */
export const permissions = sqliteTable("permissions", {
	/**
	 * Unique permission identifier in resource:action format (e.g. 'users:write', 'ssh:issue').
	 */
	id: text("id").primaryKey(),

	/**
	 * Human-readable permission title (e.g. 'Manage Users', 'Sign SSH Certificates').
	 */
	name: text("name").notNull(),

	/**
	 * Detailed description of the actions permitted by this entitlement.
	 */
	description: text("description"),

	/**
	 * Target domain or resource category (e.g. 'users', 'ssh', 'oauth', 'settings').
	 */
	resource: text("resource").notNull(),

	/**
	 * Flag indicating whether this is a system-defined permission.
	 */
	isSystem: integer("is_system", { mode: "boolean" }).notNull().default(true),

	/**
	 * Epoch timestamp (ms) when the permission was created.
	 */
	createdAt: integer("created_at").notNull(),

	/**
	 * Epoch timestamp (ms) when the permission was last modified.
	 */
	updatedAt: integer("updated_at").notNull(),
});

/**
 * Join table mapping permissions to roles.
 */
export const rolePermissions = sqliteTable(
	"role_permissions",
	{
		/**
		 * Target role receiving the permission grant.
		 */
		roleId: text("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),

		/**
		 * Permission granted to the target role.
		 */
		permissionId: text("permission_id")
			.notNull()
			.references(() => permissions.id, { onDelete: "cascade" }),

		/**
		 * Epoch timestamp (ms) when the permission was associated with the role.
		 */
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.roleId, table.permissionId] }),
		index("role_permissions_permission_idx").on(table.permissionId),
	],
);

/**
 * Join table assigning roles to individual user accounts.
 */
export const userRoles = sqliteTable(
	"user_roles",
	{
		/**
		 * User account receiving the role assignment.
		 */
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		/**
		 * Role assigned to the user.
		 */
		roleId: text("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),

		/**
		 * Epoch timestamp (ms) when the role was granted to the user.
		 */
		assignedAt: integer("assigned_at").notNull(),

		/**
		 * Administrator who granted the role assignment.
		 */
		assignedBy: text("assigned_by").references(() => users.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.roleId] }),
		index("user_roles_role_idx").on(table.roleId),
	],
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
