CREATE TABLE `lifecycle_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`execute_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`executed_at` integer,
	`cancelled_at` integer,
	`error` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lifecycle_actions_pending_idx` ON `lifecycle_actions` (`status`,`execute_at`);--> statement-breakpoint
CREATE INDEX `lifecycle_actions_user_idx` ON `lifecycle_actions` (`user_id`);