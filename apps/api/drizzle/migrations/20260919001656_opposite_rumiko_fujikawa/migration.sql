CREATE TABLE `signin_keys` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`key_hash` text NOT NULL UNIQUE,
	`key_prefix` text NOT NULL,
	`created_by_user_id` text,
	`expires_at` integer,
	`last_used_at` integer,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_signin_keys_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX `signin_keys_key_hash_idx` ON `signin_keys` (`key_hash`);--> statement-breakpoint
CREATE INDEX `signin_keys_key_prefix_idx` ON `signin_keys` (`key_prefix`);