CREATE TABLE `notifications` (
	`id` text PRIMARY KEY,
	`target` text DEFAULT 'user' NOT NULL,
	`user_id` text,
	`type` text NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`action_url` text,
	`data` text,
	`read_at` integer,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
