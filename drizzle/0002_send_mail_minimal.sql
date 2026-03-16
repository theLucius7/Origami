CREATE TABLE `compose_uploads` (
  `id` text PRIMARY KEY NOT NULL,
  `filename` text NOT NULL,
  `content_type` text NOT NULL,
  `size` integer NOT NULL,
  `r2_object_key` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `compose_uploads_created_idx` ON `compose_uploads` (`created_at`);
--> statement-breakpoint
CREATE TABLE `sent_messages` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `provider` text NOT NULL,
  `from_address` text NOT NULL,
  `to_recipients` text NOT NULL DEFAULT '[]',
  `cc_recipients` text NOT NULL DEFAULT '[]',
  `bcc_recipients` text NOT NULL DEFAULT '[]',
  `subject` text,
  `snippet` text,
  `body_text` text,
  `body_html` text,
  `provider_message_id` text,
  `status` text NOT NULL DEFAULT 'sent',
  `sent_at` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sent_messages_account_sent_idx` ON `sent_messages` (`account_id`,`sent_at`);
--> statement-breakpoint
CREATE INDEX `sent_messages_provider_id_idx` ON `sent_messages` (`provider_message_id`);
--> statement-breakpoint
CREATE TABLE `sent_message_attachments` (
  `id` text PRIMARY KEY NOT NULL,
  `sent_message_id` text NOT NULL,
  `filename` text,
  `content_type` text,
  `size` integer,
  `r2_object_key` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`sent_message_id`) REFERENCES `sent_messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sent_message_attachments_message_idx` ON `sent_message_attachments` (`sent_message_id`);