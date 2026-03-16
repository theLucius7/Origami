import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(), // 'gmail' | 'outlook' | 'qq'
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  credentials: text("credentials").notNull(), // AES-encrypted JSON
  syncCursor: text("sync_cursor"),
  initialFetchLimit: integer("initial_fetch_limit").notNull().default(200),
  lastSyncedAt: integer("last_synced_at"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const emails = sqliteTable(
  "emails",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    remoteId: text("remote_id"),
    messageId: text("message_id"),
    subject: text("subject"),
    sender: text("sender"),
    recipients: text("recipients"), // JSON array
    snippet: text("snippet"),
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),
    isRead: integer("is_read").default(0),
    isStarred: integer("is_starred").default(0),
    localDone: integer("local_done").default(0),
    localArchived: integer("local_archived").default(0),
    localSnoozeUntil: integer("local_snooze_until"),
    localLabels: text("local_labels").default("[]"),
    receivedAt: integer("received_at"),
    folder: text("folder").default("INBOX"),
    rawHeaders: text("raw_headers"),
    createdAt: integer("created_at").default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("account_message_idx").on(t.accountId, t.messageId),
    index("emails_received_at_idx").on(t.receivedAt),
    index("emails_account_received_idx").on(t.accountId, t.receivedAt),
    index("emails_is_read_account_idx").on(t.isRead, t.accountId),
    index("emails_is_starred_received_idx").on(t.isStarred, t.receivedAt),
    index("emails_folder_received_idx").on(t.folder, t.receivedAt),
    index("emails_local_archived_received_idx").on(t.localArchived, t.receivedAt),
    index("emails_local_done_received_idx").on(t.localDone, t.receivedAt),
    index("emails_local_snooze_idx").on(t.localSnoozeUntil),
  ]
);

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    emailId: text("email_id")
      .notNull()
      .references(() => emails.id, { onDelete: "cascade" }),
    filename: text("filename"),
    contentType: text("content_type"),
    size: integer("size"),
    r2ObjectKey: text("r2_object_key").notNull(),
    createdAt: integer("created_at").default(sql`(unixepoch())`),
  },
  (t) => [index("attachments_email_id_idx").on(t.emailId)]
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type EmailListItem = Pick<
  Email,
  | "id"
  | "accountId"
  | "remoteId"
  | "messageId"
  | "subject"
  | "sender"
  | "snippet"
  | "isRead"
  | "isStarred"
  | "localDone"
  | "localArchived"
  | "localSnoozeUntil"
  | "receivedAt"
  | "folder"
  | "createdAt"
>;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
