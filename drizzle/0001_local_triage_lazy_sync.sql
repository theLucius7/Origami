ALTER TABLE accounts ADD COLUMN initial_fetch_limit integer NOT NULL DEFAULT 200;
--> statement-breakpoint
ALTER TABLE emails ADD COLUMN remote_id text;
--> statement-breakpoint
ALTER TABLE emails ADD COLUMN local_done integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE emails ADD COLUMN local_archived integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE emails ADD COLUMN local_snooze_until integer;
--> statement-breakpoint
ALTER TABLE emails ADD COLUMN local_labels text DEFAULT '[]';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS emails_local_archived_received_idx ON emails(local_archived, received_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS emails_local_done_received_idx ON emails(local_done, received_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS emails_local_snooze_idx ON emails(local_snooze_until);
