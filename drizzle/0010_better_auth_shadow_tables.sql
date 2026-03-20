CREATE TABLE `user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `email_verified` integer DEFAULT false NOT NULL,
  `image` text,
  `github_id` text NOT NULL,
  `github_login` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_user_email_idx` ON `user` (`email`);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_user_github_id_idx` ON `user` (`github_id`);
--> statement-breakpoint
CREATE INDEX `auth_user_github_login_idx` ON `user` (`github_login`);
--> statement-breakpoint
CREATE TABLE `session` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `token` text NOT NULL,
  `expires_at` integer NOT NULL,
  `ip_address` text,
  `user_agent` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_session_token_idx` ON `session` (`token`);
--> statement-breakpoint
CREATE INDEX `auth_session_user_id_idx` ON `session` (`user_id`);
--> statement-breakpoint
CREATE INDEX `auth_session_expires_at_idx` ON `session` (`expires_at`);
--> statement-breakpoint
CREATE TABLE `account` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` integer,
  `refresh_token_expires_at` integer,
  `scope` text,
  `password` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_account_provider_account_idx` ON `account` (`provider_id`,`account_id`);
--> statement-breakpoint
CREATE INDEX `auth_account_user_id_idx` ON `account` (`user_id`);
--> statement-breakpoint
CREATE TABLE `verification` (
  `id` text PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_verification_identifier_value_idx` ON `verification` (`identifier`,`value`);
--> statement-breakpoint
CREATE INDEX `auth_verification_expires_at_idx` ON `verification` (`expires_at`);
