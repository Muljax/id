import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const roles = sqliteTable("roles", {
	id: text("id").primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description"),
	isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const permissions = sqliteTable("permissions", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	resource: text("resource").notNull(),
	isSystem: integer("is_system", { mode: "boolean" }).notNull().default(true),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const rolePermissions = sqliteTable(
	"role_permissions",
	{
		roleId: text("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		permissionId: text("permission_id")
			.notNull()
			.references(() => permissions.id, { onDelete: "cascade" }),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.roleId, table.permissionId] }),
		index("role_permissions_permission_idx").on(table.permissionId),
	],
);

export const userRoles = sqliteTable(
	"user_roles",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		roleId: text("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		assignedAt: integer("assigned_at").notNull(),
		assignedBy: text("assigned_by").references(() => users.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.roleId] }),
		index("user_roles_role_idx").on(table.roleId),
	],
);
