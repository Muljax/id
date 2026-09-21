import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

/**
 * Scheduled asynchronous user lifecycle events (e.g. account deletion, deactivation, data purge).
 */
export const lifecycleActions = sqliteTable(
	"lifecycle_actions",
	{
		/**
		 * Unique identifier for the lifecycle action record.
		 */
		id: text("id").primaryKey(),

		/**
		 * User account targeted by this lifecycle action.
		 */
		userId: text("user_id")
			.notNull()
			.references(() => users.id, {
				onDelete: "cascade",
			}),

		/**
		 * Action verb to perform (e.g. 'delete_user', 'disable_user', 'purge_telemetry').
		 */
		action: text("action").notNull(),

		/**
		 * Epoch timestamp (ms) when the action should be executed by the background worker.
		 */
		executeAt: integer("execute_at").notNull(),

		/**
		 * Current execution status: 'pending', 'processing', 'completed', 'failed', or 'cancelled'.
		 */
		status: text("status").notNull().default("pending"),

		/**
		 * Epoch timestamp (ms) when this lifecycle action was queued.
		 */
		createdAt: integer("created_at").notNull(),

		/**
		 * Epoch timestamp (ms) when the action state was last updated.
		 */
		updatedAt: integer("updated_at").notNull(),

		/**
		 * Epoch timestamp (ms) when the action was successfully executed.
		 */
		executedAt: integer("executed_at"),

		/**
		 * Epoch timestamp (ms) when the action was cancelled by an admin or user grace period.
		 */
		cancelledAt: integer("cancelled_at"),

		/**
		 * Error message or diagnostic details if execution failed.
		 */
		error: text("error"),
	},
	(table) => [
		index("lifecycle_actions_pending_idx").on(table.status, table.executeAt),
		index("lifecycle_actions_user_idx").on(table.userId),
	],
);

export type LifecycleAction = typeof lifecycleActions.$inferSelect;
export type NewLifecycleAction = typeof lifecycleActions.$inferInsert;
