CREATE TABLE `oauth_device_codes` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`device_code_hash` text NOT NULL UNIQUE,
	`user_code` text NOT NULL UNIQUE,
	`scope` text NOT NULL,
	`user_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`polling_interval` integer DEFAULT 5 NOT NULL,
	`last_polled_at` integer,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_oauth_device_codes_client_id_oauth_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_oauth_device_codes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
