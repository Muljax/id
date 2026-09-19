import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const mode = {
	signup: ["enabled", "invite", "disabled"],
	signin: ["enabled", "admin_key", "disabled"],
} as const;

export type SignupMode = (typeof mode.signup)[number];

export type SigninMode = (typeof mode.signin)[number];

export const instanceSettings = sqliteTable("instance_settings", {
	id: integer("id").primaryKey(),

	/**
	 * User registration policy.
	 *
	 * enabled  - anyone can create an account
	 * invite   - registration requires an invitation
	 * disabled - registration is completely disabled
	 */
	signupMode: text("signup_mode", {
		enum: mode.signup,
	})
		.notNull()
		.default("enabled"),

	/**
	 * Authentication policy.
	 *
	 * enabled   - normal sign-in is allowed
	 * admin_key - sign-in requires an administrator-provided key
	 * disabled  - sign-in is completely disabled
	 */
	signinMode: text("signin_mode", {
		enum: mode.signin,
	})
		.notNull()
		.default("enabled"),

	createdAt: integer("created_at")
		.notNull()
		.$defaultFn(() => Date.now()),

	updatedAt: integer("updated_at")
		.notNull()
		.$defaultFn(() => Date.now()),
});

export type InstanceSettings = typeof instanceSettings.$inferSelect;
