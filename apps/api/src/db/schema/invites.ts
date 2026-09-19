import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { roles } from "./rbac";
import { users } from "./users";

export const inviteTokens = sqliteTable(
	"invite_tokens",
	{
		id: text("id").primaryKey(),

		/**
		 * Target email restriction (optional).
		 * If specified, only this email address can use this invite token.
		 */
		email: text("email"),

		/**
		 * SHA-256 hash of the invite token.
		 */
		tokenHash: text("token_hash").notNull().unique(),

		/**
		 * Role assigned upon account creation (defaults to 'user').
		 */
		roleId: text("role_id")
			.notNull()
			.default("user")
			.references(() => roles.id, { onDelete: "cascade" }),

		/**
		 * Administrator who generated this invite.
		 */
		createdByUserId: text("created_by_user_id").references(() => users.id, {
			onDelete: "set null",
		}),

		/**
		 * User who consumed this invite token.
		 */
		usedByUserId: text("used_by_user_id").references(() => users.id, {
			onDelete: "set null",
		}),

		expiresAt: integer("expires_at").notNull(),

		usedAt: integer("used_at"),

		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("invite_tokens_token_hash_idx").on(table.tokenHash),
		index("invite_tokens_email_idx").on(table.email),
	],
);

export type InviteToken = typeof inviteTokens.$inferSelect;
export type NewInviteToken = typeof inviteTokens.$inferInsert;
