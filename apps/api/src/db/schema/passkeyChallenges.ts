import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Ephemeral cryptographic challenges generated during WebAuthn registration and authentication ceremonies.
 */
export const passkeyChallenges = sqliteTable("passkey_challenges", {
	/**
	 * Unique identifier for the challenge transaction.
	 */
	id: text("id").primaryKey(),

	/**
	 * User ID associated with the ceremony (optional for discoverable passkey sign-in).
	 */
	userId: text("user_id"),

	/**
	 * Cryptographically random challenge string to be signed by the authenticator.
	 */
	challenge: text("challenge").notNull(),

	/**
	 * Epoch timestamp (ms) when this challenge expires (typically 5 minutes from creation).
	 */
	expiresAt: integer("expires_at").notNull(),

	/**
	 * Epoch timestamp (ms) when this challenge was issued.
	 */
	createdAt: integer("created_at").notNull(),
});

export type PasskeyChallenge = typeof passkeyChallenges.$inferSelect;
export type NewPasskeyChallenge = typeof passkeyChallenges.$inferInsert;
