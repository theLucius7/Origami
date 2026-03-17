ALTER TABLE `accounts` ADD `preset_key` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `auth_user` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `imap_host` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `imap_port` integer;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `imap_secure` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `smtp_host` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `smtp_port` integer;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `smtp_secure` integer DEFAULT 1 NOT NULL;
