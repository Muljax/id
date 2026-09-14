PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_oauth_access_tokens` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`user_id` text,
	`token_hash` text NOT NULL UNIQUE,
	`scope` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`revoked_at` integer,
	`authorization_code_id` text,
	CONSTRAINT `oauth_access_tokens_client_id_oauth_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `oauth_access_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_oauth_access_tokens_authorization_code_id_oauth_authorization_codes_id_fk` FOREIGN KEY (`authorization_code_id`) REFERENCES `oauth_authorization_codes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_oauth_access_tokens`(`id`, `client_id`, `user_id`, `token_hash`, `scope`, `expires_at`, `created_at`, `revoked_at`, `authorization_code_id`) SELECT `id`, `client_id`, `user_id`, `token_hash`, `scope`, `expires_at`, `created_at`, `revoked_at`, `authorization_code_id` FROM `oauth_access_tokens`;--> statement-breakpoint
DROP TABLE `oauth_access_tokens`;--> statement-breakpoint
ALTER TABLE `__new_oauth_access_tokens` RENAME TO `oauth_access_tokens`;--> statement-breakpoint
PRAGMA foreign_keys=ON;