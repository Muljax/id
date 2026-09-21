CREATE TABLE `instance_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`signup_mode` text DEFAULT 'enabled' NOT NULL,
	`signin_mode` text DEFAULT 'enabled' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
