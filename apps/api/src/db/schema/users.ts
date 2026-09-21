import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Core user accounts table storing identity, credentials, and OIDC profile attributes.
 */
export const users = sqliteTable("users", {
	/**
	 * Unique identifier for the user account.
	 */
	id: text("id").primaryKey(),

	/**
	 * Primary email address used for authentication and notifications.
	 */
	email: text("email").notNull().unique(),

	/**
	 * Argon2id hashed password for standard password-based sign-in.
	 */
	passwordHash: text("password_hash").notNull(),

	/**
	 * Full user-facing display name (OIDC standard claim: name).
	 */
	displayName: text("display_name"),

	/**
	 * Given or first name (OIDC standard claim: given_name).
	 */
	givenName: text("given_name"),

	/**
	 * Family or last name (OIDC standard claim: family_name).
	 */
	familyName: text("family_name"),

	/**
	 * Middle name (OIDC standard claim: middle_name).
	 */
	middleName: text("middle_name"),

	/**
	 * Casual or shorthand nickname (OIDC standard claim: nickname).
	 */
	nickname: text("nickname"),

	/**
	 * Unique username handle for mentions and CLI logins (OIDC standard claim: preferred_username).
	 */
	preferredUsername: text("preferred_username").unique(),

	/**
	 * URL pointing to the user's external profile page.
	 */
	profileUrl: text("profile_url"),

	/**
	 * Object storage key or URL for the user's avatar image.
	 */
	profileImageKey: text("profile_image_key"),

	/**
	 * URL of the user's personal or company homepage.
	 */
	website: text("website"),

	/**
	 * Gender identity (OIDC standard claim: gender).
	 */
	gender: text("gender"),

	/**
	 * Birthdate in YYYY-MM-DD or YYYY format (OIDC standard claim: birthdate).
	 */
	birthdate: text("birthdate"),

	/**
	 * IANA time zone identifier (e.g. 'America/New_York', 'UTC').
	 */
	zoneinfo: text("zoneinfo"),

	/**
	 * BCP 47 language/locale preference (e.g. 'en-US', 'fr-FR').
	 */
	locale: text("locale"),

	/**
	 * Epoch timestamp (ms) when email ownership was verified.
	 */
	emailVerifiedAt: integer("email_verified_at"),

	/**
	 * Epoch timestamp (ms) when this account was disabled or locked.
	 */
	disabledAt: integer("disabled_at"),

	/**
	 * Epoch timestamp (ms) when the account was created.
	 */
	createdAt: integer("created_at").notNull(),

	/**
	 * Epoch timestamp (ms) when profile information was last modified.
	 */
	updatedAt: integer("updated_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
