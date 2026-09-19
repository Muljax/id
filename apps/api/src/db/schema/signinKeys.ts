import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const signinKeys = sqliteTable(
	"signin_keys",
	{
		id: text("id").primaryKey(),

		/**
		 * Human-readable label for this key (e.g. "Emergency Access Key", "Maintenance 2026").
		 */
		name: text("name").notNull(),

		/**
		 * SHA-256 hash of the full access key.
		 */
		keyHash: text("key_hash").notNull().unique(),

		/**
		 * First few characters of the key for identification in the UI (e.g., "id_key_ab12").
		 */
		keyPrefix: text("key_prefix").notNull(),

		/**
		 * Administrator who generated this access key.
		 */
		createdByUserId: text("created_by_user_id").references(() => users.id, {
			onDelete: "set null",
		}),

		/**
		 * Expiration timestamp (epoch ms), or null if never expires.
		 */
		expiresAt: integer("expires_at"),

		/**
		 * Timestamp when this key was last used for authentication.
		 */
		lastUsedAt: integer("last_used_at"),

		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("signin_keys_key_hash_idx").on(table.keyHash),
		index("signin_keys_key_prefix_idx").on(table.keyPrefix),
	],
);

export type SigninKey = typeof signinKeys.$inferSelect;
export type NewSigninKey = typeof signinKeys.$inferInsert;
