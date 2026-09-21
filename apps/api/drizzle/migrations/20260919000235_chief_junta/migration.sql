CREATE TABLE `invite_tokens` (
	`id` text PRIMARY KEY,
	`email` text,
	`token_hash` text NOT NULL UNIQUE,
	`role_id` text DEFAULT 'user' NOT NULL,
	`created_by_user_id` text,
	`used_by_user_id` text,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_invite_tokens_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_invite_tokens_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_invite_tokens_used_by_user_id_users_id_fk` FOREIGN KEY (`used_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX `invite_tokens_token_hash_idx` ON `invite_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `invite_tokens_email_idx` ON `invite_tokens` (`email`);