CREATE TABLE `oauth_apps` (
  `id` text PRIMARY KEY NOT NULL,
  `provider` text NOT NULL,
  `label` text NOT NULL,
  `client_id` text NOT NULL,
  `client_secret` text NOT NULL,
  `tenant` text,
  `created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_apps_provider_label_idx` ON `oauth_apps` (`provider`,`label`);
--> statement-breakpoint
CREATE INDEX `oauth_apps_provider_created_idx` ON `oauth_apps` (`provider`,`created_at`);
