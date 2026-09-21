PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_passkey_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_passkey_challenges`("id", "challenge", "expires_at", "created_at") SELECT "id", "challenge", "expires_at", "created_at" FROM `passkey_challenges`;--> statement-breakpoint
DROP TABLE `passkey_challenges`;--> statement-breakpoint
ALTER TABLE `__new_passkey_challenges` RENAME TO `passkey_challenges`;--> statement-breakpoint
PRAGMA foreign_keys=ON;