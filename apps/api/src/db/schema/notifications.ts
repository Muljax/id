import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

/**
 * System and security notification events dispatched to users or administrators.
 */
export const notifications = sqliteTable("notifications", {
	/**
	 * Unique identifier for the notification record.
	 */
	id: text("id").primaryKey(),

	/**
	 * Audience scope: 'user' (individual), 'admin' (all administrators), or 'broadcast' (system-wide).
	 */
	target: text("target").notNull().default("user"),

	/**
	 * Recipient user ID (nullable for broadcast notifications).
	 */
	userId: text("user_id").references(() => users.id, {
		onDelete: "cascade",
	}),

	/**
	 * Notification event type identifier (e.g. 'new_device_login', 'ssh_cert_issued', 'password_changed').
	 */
	type: text("type").notNull(),

	/**
	 * Functional category for filtering (e.g. 'security', 'auth', 'system', 'general').
	 */
	category: text("category").notNull().default("general"),

	/**
	 * Severity level: 'info', 'warning', 'critical'.
	 */
	severity: text("severity").notNull().default("info"),

	/**
	 * Concise headline summary of the notification.
	 */
	title: text("title").notNull(),

	/**
	 * Full markdown or plaintext message content.
	 */
	message: text("message").notNull(),

	/**
	 * Target URL or deep-link for user action (e.g. '/settings/security').
	 */
	actionUrl: text("action_url"),

	/**
	 * JSON-serialized context object with relevant entity IDs and metadata.
	 */
	data: text("data"),

	/**
	 * Epoch timestamp (ms) when the user marked this notification as read, or null if unread.
	 */
	readAt: integer("read_at"),

	/**
	 * Epoch timestamp (ms) when the notification was generated.
	 */
	createdAt: integer("created_at").notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
