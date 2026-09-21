import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const mode = {
	signup: ["enabled", "invite", "disabled"],
	signin: ["enabled", "admin_key", "disabled"],
} as const;

export type SignupMode = (typeof mode.signup)[number];

export type SigninMode = (typeof mode.signin)[number];

/**
 * Global instance configuration governing self-registration, sign-in restrictions, and platform policies.
 */
export const instanceSettings = sqliteTable("instance_settings", {
	/**
	 * Primary key singleton identifier (always row 1).
	 */
	id: integer("id").primaryKey(),

	/**
	 * User registration policy ('enabled' = open signup, 'invite' = invite token only, 'disabled' = closed).
	 */
	signupMode: text("signup_mode", {
		enum: mode.signup,
	})
		.notNull()
		.default("enabled"),

	/**
	 * Authentication policy ('enabled' = standard login, 'admin_key' = sign-in key required, 'disabled' = system locked).
	 */
	signinMode: text("signin_mode", {
		enum: mode.signin,
	})
		.notNull()
		.default("enabled"),

	/**
	 * Epoch timestamp (ms) when instance settings were initialized.
	 */
	createdAt: integer("created_at")
		.notNull()
		.$defaultFn(() => Date.now()),

	/**
	 * Epoch timestamp (ms) when instance settings were last modified.
	 */
	updatedAt: integer("updated_at")
		.notNull()
		.$defaultFn(() => Date.now()),
});

export type InstanceSettings = typeof instanceSettings.$inferSelect;
export type NewInstanceSettings = typeof instanceSettings.$inferInsert;
