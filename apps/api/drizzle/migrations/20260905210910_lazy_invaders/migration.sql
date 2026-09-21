ALTER TABLE `users` ADD `given_name` text;--> statement-breakpoint
ALTER TABLE `users` ADD `family_name` text;--> statement-breakpoint
ALTER TABLE `users` ADD `middle_name` text;--> statement-breakpoint
ALTER TABLE `users` ADD `nickname` text;--> statement-breakpoint
ALTER TABLE `users` ADD `preferred_username` text;--> statement-breakpoint
ALTER TABLE `users` ADD `profile_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `website` text;--> statement-breakpoint
ALTER TABLE `users` ADD `gender` text;--> statement-breakpoint
ALTER TABLE `users` ADD `birthdate` text;--> statement-breakpoint
ALTER TABLE `users` ADD `zoneinfo` text;--> statement-breakpoint
ALTER TABLE `users` ADD `locale` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`display_name` text,
	`given_name` text,
	`family_name` text,
	`middle_name` text,
	`nickname` text,
	`preferred_username` text UNIQUE,
	`profile_url` text,
	`profile_image_key` text,
	`website` text,
	`gender` text,
	`birthdate` text,
	`zoneinfo` text,
	`locale` text,
	`email_verified_at` integer,
	`is_admin` integer DEFAULT false NOT NULL,
	`disabled_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`(`id`, `email`, `password_hash`, `display_name`, `email_verified_at`, `is_admin`, `disabled_at`, `created_at`, `updated_at`, `profile_image_key`) SELECT `id`, `email`, `password_hash`, `display_name`, `email_verified_at`, `is_admin`, `disabled_at`, `created_at`, `updated_at`, `profile_image_key` FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_single_admin_idx` ON `users` (`is_admin`) WHERE "users"."is_admin" = 1;