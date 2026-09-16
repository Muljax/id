import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),

	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),

	displayName: text("display_name"),
	givenName: text("given_name"),
	familyName: text("family_name"),
	middleName: text("middle_name"),
	nickname: text("nickname"),
	preferredUsername: text("preferred_username").unique(),

	profileUrl: text("profile_url"),
	profileImageKey: text("profile_image_key"),
	website: text("website"),

	gender: text("gender"),
	birthdate: text("birthdate"),
	zoneinfo: text("zoneinfo"),
	locale: text("locale"),

	emailVerifiedAt: integer("email_verified_at"),

	disabledAt: integer("disabled_at"),

	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});
