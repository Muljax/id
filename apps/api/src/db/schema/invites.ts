import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { roles } from "./rbac";
import { users } from "./users";

/**
 * Invitations issued by administrators granting new users registration access and initial roles.
 */
export const inviteTokens = sqliteTable(
	"invite_tokens",
	{
		/**
		 * Unique identifier for the invitation token record.
		 */
		id: text("id").primaryKey(),

		/**
		 * Target email restriction (optional). If specified, only this email address can consume this invite.
		 */
		email: text("email"),

		/**
		 * SHA-256 hash of the secret invitation token string.
		 */
		tokenHash: text("token_hash").notNull().unique(),

		/**
		 * Initial authorization role assigned to the user upon successful registration.
		 */
		roleId: text("role_id")
			.notNull()
			.default("user")
			.references(() => roles.id, { onDelete: "cascade" }),

		/**
		 * Administrator who generated this invitation.
		 */
		createdByUserId: text("created_by_user_id").references(() => users.id, {
			onDelete: "set null",
		}),

		/**
		 * User who consumed this invitation during signup.
		 */
		usedByUserId: text("used_by_user_id").references(() => users.id, {
			onDelete: "set null",
		}),

		/**
		 * Epoch timestamp (ms) when this invitation expires.
		 */
		expiresAt: integer("expires_at").notNull(),

		/**
		 * Epoch timestamp (ms) when this invitation was consumed, or null if unused.
		 */
		usedAt: integer("used_at"),

		/**
		 * Epoch timestamp (ms) when this invitation was generated.
		 */
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("invite_tokens_token_hash_idx").on(table.tokenHash),
		index("invite_tokens_email_idx").on(table.email),
	],
);

export type InviteToken = typeof inviteTokens.$inferSelect;
export type NewInviteToken = typeof inviteTokens.$inferInsert;
