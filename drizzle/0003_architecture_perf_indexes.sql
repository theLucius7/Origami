CREATE INDEX IF NOT EXISTS emails_account_archive_received_idx
  ON emails(account_id, local_archived, received_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS emails_account_archive_starred_received_idx
  ON emails(account_id, local_archived, is_starred, received_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS emails_account_archive_read_received_idx
  ON emails(account_id, local_archived, is_read, received_at DESC);
