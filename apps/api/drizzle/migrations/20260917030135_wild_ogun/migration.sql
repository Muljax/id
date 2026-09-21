CREATE TABLE `ssh_certificates` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`serial` text NOT NULL,
	`key_id` text NOT NULL,
	`principals` text NOT NULL,
	`valid_after` integer NOT NULL,
	`valid_before` integer NOT NULL,
	`fingerprint` text NOT NULL,
	`ca_fingerprint` text NOT NULL,
	`client_ip` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_ssh_certificates_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_ssh_keys` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`public_key` text NOT NULL,
	`fingerprint` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	CONSTRAINT `fk_user_ssh_keys_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `ssh_certificates_user_idx` ON `ssh_certificates` (`user_id`);--> statement-breakpoint
CREATE INDEX `ssh_certificates_serial_idx` ON `ssh_certificates` (`serial`);--> statement-breakpoint
CREATE INDEX `ssh_certificates_fingerprint_idx` ON `ssh_certificates` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `user_ssh_keys_user_idx` ON `user_ssh_keys` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_ssh_keys_fingerprint_idx` ON `user_ssh_keys` (`fingerprint`);