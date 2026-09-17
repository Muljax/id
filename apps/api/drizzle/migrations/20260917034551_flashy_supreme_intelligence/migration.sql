ALTER TABLE `ssh_certificates` ADD `revoked_at` integer;--> statement-breakpoint
ALTER TABLE `ssh_certificates` ADD `revoked_by` text;--> statement-breakpoint
ALTER TABLE `ssh_certificates` ADD `revoked_reason` text;