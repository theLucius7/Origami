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
