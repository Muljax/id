import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

/**
 * Single-use password reset verification tokens sent via email.
 */
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
	/**
	 * Unique identifier for the reset token record.
	 */
	id: text("id").primaryKey(),

	/**
	 * User account requesting the password reset.
	 */
	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),

	/**
	 * SHA-256 hash of the secret password reset token sent via email link.
	 */
	tokenHash: text("token_hash").notNull().unique(),

	/**
	 * Epoch timestamp (ms) when this reset token expires.
	 */
	expiresAt: integer("expires_at").notNull(),

	/**
	 * Epoch timestamp (ms) when this token was generated.
	 */
	createdAt: integer("created_at").notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
