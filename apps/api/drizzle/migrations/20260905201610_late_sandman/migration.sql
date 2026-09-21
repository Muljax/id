PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_oauth_access_tokens` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL UNIQUE,
	`scope` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`revoked_at` integer,
	CONSTRAINT `oauth_access_tokens_client_id_oauth_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `oauth_access_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_oauth_access_tokens`(`id`, `client_id`, `user_id`, `token_hash`, `scope`, `expires_at`, `created_at`, `revoked_at`) SELECT `id`, `client_id`, `user_id`, `token_hash`, `scope`, `expires_at`, `created_at`, `revoked_at` FROM `oauth_access_tokens`;--> statement-breakpoint
DROP TABLE `oauth_access_tokens`;--> statement-breakpoint
ALTER TABLE `__new_oauth_access_tokens` RENAME TO `oauth_access_tokens`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_oauth_authorization_codes` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`user_id` text NOT NULL,
	`code_hash` text NOT NULL UNIQUE,
	`redirect_uri` text NOT NULL,
	`scope` text NOT NULL,
	`nonce` text,
	`code_challenge` text,
	`code_challenge_method` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`used_at` integer,
	CONSTRAINT `oauth_authorization_codes_client_id_oauth_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `oauth_authorization_codes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_oauth_authorization_codes`(`id`, `client_id`, `user_id`, `code_hash`, `redirect_uri`, `scope`, `nonce`, `code_challenge`, `code_challenge_method`, `expires_at`, `created_at`, `used_at`) SELECT `id`, `client_id`, `user_id`, `code_hash`, `redirect_uri`, `scope`, `nonce`, `code_challenge`, `code_challenge_method`, `expires_at`, `created_at`, `used_at` FROM `oauth_authorization_codes`;--> statement-breakpoint
DROP TABLE `oauth_authorization_codes`;--> statement-breakpoint
ALTER TABLE `__new_oauth_authorization_codes` RENAME TO `oauth_authorization_codes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_oauth_refresh_tokens` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL UNIQUE,
	`scope` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`revoked_at` integer,
	`replaced_by` text,
	CONSTRAINT `oauth_refresh_tokens_client_id_oauth_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `oauth_refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_oauth_refresh_tokens`(`id`, `client_id`, `user_id`, `token_hash`, `scope`, `expires_at`, `created_at`, `revoked_at`, `replaced_by`) SELECT `id`, `client_id`, `user_id`, `token_hash`, `scope`, `expires_at`, `created_at`, `revoked_at`, `replaced_by` FROM `oauth_refresh_tokens`;--> statement-breakpoint
DROP TABLE `oauth_refresh_tokens`;--> statement-breakpoint
ALTER TABLE `__new_oauth_refresh_tokens` RENAME TO `oauth_refresh_tokens`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_passkeys` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`credential_id` text NOT NULL UNIQUE,
	`public_key` text NOT NULL,
	`counter` integer DEFAULT 0 NOT NULL,
	`transports` text,
	`name` text,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	CONSTRAINT `passkeys_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_passkeys`(`id`, `user_id`, `credential_id`, `public_key`, `counter`, `transports`, `name`, `created_at`, `last_used_at`) SELECT `id`, `user_id`, `credential_id`, `public_key`, `counter`, `transports`, `name`, `created_at`, `last_used_at` FROM `passkeys`;--> statement-breakpoint
DROP TABLE `passkeys`;--> statement-breakpoint
ALTER TABLE `__new_passkeys` RENAME TO `passkeys`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_password_reset_tokens` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL UNIQUE,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `password_reset_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_password_reset_tokens`(`id`, `user_id`, `token_hash`, `expires_at`, `created_at`) SELECT `id`, `user_id`, `token_hash`, `expires_at`, `created_at` FROM `password_reset_tokens`;--> statement-breakpoint
DROP TABLE `password_reset_tokens`;--> statement-breakpoint
ALTER TABLE `__new_password_reset_tokens` RENAME TO `password_reset_tokens`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL UNIQUE,
	`ip_address` text,
	`country` text,
	`city` text,
	`region` text,
	`user_agent` text,
	`browser` text,
	`os` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_sessions`(`id`, `user_id`, `token_hash`, `ip_address`, `country`, `city`, `region`, `user_agent`, `browser`, `os`, `expires_at`, `created_at`, `last_used_at`) SELECT `id`, `user_id`, `token_hash`, `ip_address`, `country`, `city`, `region`, `user_agent`, `browser`, `os`, `expires_at`, `created_at`, `last_used_at` FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`display_name` text,
	`email_verified_at` integer,
	`is_admin` integer DEFAULT false NOT NULL,
	`disabled_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`profile_image_key` text
);
--> statement-breakpoint
INSERT INTO `__new_users`(`id`, `email`, `password_hash`, `display_name`, `email_verified_at`, `is_admin`, `disabled_at`, `created_at`, `updated_at`, `profile_image_key`) SELECT `id`, `email`, `password_hash`, `display_name`, `email_verified_at`, `is_admin`, `disabled_at`, `created_at`, `updated_at`, `profile_image_key` FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `passkeys_credential_id_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `password_reset_tokens_token_hash_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `sessions_token_hash_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `users_email_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `oauth_access_tokens_token_hash_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `oauth_authorization_codes_code_hash_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `oauth_refresh_tokens_token_hash_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_single_admin_idx` ON `users` (`is_admin`) WHERE "users"."is_admin" = 1;