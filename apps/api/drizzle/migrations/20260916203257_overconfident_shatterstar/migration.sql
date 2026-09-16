CREATE TABLE `permissions` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`resource` text NOT NULL,
	`is_system` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `role_permissions_pk` PRIMARY KEY(`role_id`, `permission_id`),
	CONSTRAINT `fk_role_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_role_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	`assigned_by` text,
	CONSTRAINT `user_roles_pk` PRIMARY KEY(`user_id`, `role_id`),
	CONSTRAINT `fk_user_roles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_roles_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_roles_assigned_by_users_id_fk` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS `users_single_admin_idx`;--> statement-breakpoint
CREATE INDEX `role_permissions_permission_idx` ON `role_permissions` (`permission_id`);--> statement-breakpoint
CREATE INDEX `user_roles_role_idx` ON `user_roles` (`role_id`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `is_admin`;