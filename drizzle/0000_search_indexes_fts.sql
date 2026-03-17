CREATE TABLE IF NOT EXISTS `accounts` (
  `id` text PRIMARY KEY NOT NULL,
  `provider` text NOT NULL,
  `email` text NOT NULL,
  `display_name` text,
  `credentials` text NOT NULL,
  `sync_cursor` text,
  `last_synced_at` integer,
  `created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `accounts_email_unique` ON `accounts` (`email`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `emails` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `message_id` text,
  `subject` text,
  `sender` text,
  `recipients` text,
  `snippet` text,
  `body_text` text,
  `body_html` text,
  `is_read` integer DEFAULT 0,
  `is_starred` integer DEFAULT 0,
  `received_at` integer,
  `folder` text DEFAULT 'INBOX',
  `raw_headers` text,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `account_message_idx` ON `emails` (`account_id`, `message_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `attachments` (
  `id` text PRIMARY KEY NOT NULL,
  `email_id` text NOT NULL,
  `filename` text,
  `content_type` text,
  `size` integer,
  `r2_object_key` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS emails_received_at_idx ON emails(received_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS emails_account_received_idx ON emails(account_id, received_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS emails_is_read_account_idx ON emails(is_read, account_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS emails_is_starred_received_idx ON emails(is_starred, received_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS emails_folder_received_idx ON emails(folder, received_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS attachments_email_id_idx ON attachments(email_id);
--> statement-breakpoint
CREATE VIRTUAL TABLE IF NOT EXISTS emails_fts USING fts5(
  subject,
  sender,
  snippet,
  content='emails',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS emails_ai_fts AFTER INSERT ON emails BEGIN
  INSERT INTO emails_fts(rowid, subject, sender, snippet)
  VALUES (new.rowid, coalesce(new.subject, ''), coalesce(new.sender, ''), coalesce(new.snippet, ''));
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS emails_ad_fts AFTER DELETE ON emails BEGIN
  INSERT INTO emails_fts(emails_fts, rowid, subject, sender, snippet)
  VALUES ('delete', old.rowid, coalesce(old.subject, ''), coalesce(old.sender, ''), coalesce(old.snippet, ''));
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS emails_au_fts AFTER UPDATE ON emails BEGIN
  INSERT INTO emails_fts(emails_fts, rowid, subject, sender, snippet)
  VALUES ('delete', old.rowid, coalesce(old.subject, ''), coalesce(old.sender, ''), coalesce(old.snippet, ''));
  INSERT INTO emails_fts(rowid, subject, sender, snippet)
  VALUES (new.rowid, coalesce(new.subject, ''), coalesce(new.sender, ''), coalesce(new.snippet, ''));
END;
--> statement-breakpoint
INSERT INTO emails_fts(rowid, subject, sender, snippet)
SELECT rowid, coalesce(subject, ''), coalesce(sender, ''), coalesce(snippet, '')
FROM emails
WHERE rowid NOT IN (SELECT rowid FROM emails_fts);
