import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(), // 'gmail' | 'outlook' | 'qq' | 'imap_smtp'
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  credentials: text("credentials").notNull(), // AES-encrypted JSON
  oauthAppId: text("oauth_app_id"),
  presetKey: text("preset_key"),
  authUser: text("auth_user"),
  imapHost: text("imap_host"),
  imapPort: integer("imap_port"),
  imapSecure: integer("imap_secure").notNull().default(1),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpSecure: integer("smtp_secure").notNull().default(1),
  syncCursor: text("sync_cursor"),
  syncReadBack: integer("sync_read_back").notNull().default(0),
  syncStarBack: integer("sync_star_back").notNull().default(0),
  initialFetchLimit: integer("initial_fetch_limit").notNull().default(200),
  lastSyncedAt: integer("last_synced_at"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const oauthApps = sqliteTable(
  "oauth_apps",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(), // 'gmail' | 'outlook'
    label: text("label").notNull(),
    clientId: text("client_id").notNull(),
    clientSecret: text("client_secret").notNull(), // AES-encrypted
    tenant: text("tenant"),
    createdAt: integer("created_at").default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("oauth_apps_provider_label_idx").on(t.provider, t.label),
    index("oauth_apps_provider_created_idx").on(t.provider, t.createdAt),
  ]
);

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
    index("emails_account_archive_received_idx").on(t.accountId, t.localArchived, t.receivedAt),
    index("emails_account_archive_starred_received_idx").on(
      t.accountId,
      t.localArchived,
      t.isStarred,
      t.receivedAt
    ),
    index("emails_account_archive_read_received_idx").on(
      t.accountId,
      t.localArchived,
      t.isRead,
      t.receivedAt
    ),
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

export const composeUploads = sqliteTable(
  "compose_uploads",
  {
    id: text("id").primaryKey(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    r2ObjectKey: text("r2_object_key").notNull(),
    createdAt: integer("created_at").default(sql`(unixepoch())`),
  },
  (t) => [index("compose_uploads_created_idx").on(t.createdAt)]
);

export const sentMessages = sqliteTable(
  "sent_messages",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    fromAddress: text("from_address").notNull(),
    toRecipients: text("to_recipients").notNull().default("[]"),
    ccRecipients: text("cc_recipients").notNull().default("[]"),
    bccRecipients: text("bcc_recipients").notNull().default("[]"),
    subject: text("subject"),
    snippet: text("snippet"),
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),
    providerMessageId: text("provider_message_id"),
    status: text("status").notNull().default("sent"),
    sentAt: integer("sent_at").notNull(),
    createdAt: integer("created_at").default(sql`(unixepoch())`),
  },
  (t) => [
    index("sent_messages_account_sent_idx").on(t.accountId, t.sentAt),
    index("sent_messages_sent_at_idx").on(t.sentAt),
  ]
);

export const sentMessageAttachments = sqliteTable(
  "sent_message_attachments",
  {
    id: text("id").primaryKey(),
    sentMessageId: text("sent_message_id")
      .notNull()
      .references(() => sentMessages.id, { onDelete: "cascade" }),
    filename: text("filename"),
    contentType: text("content_type"),
    size: integer("size"),
    r2ObjectKey: text("r2_object_key").notNull(),
    createdAt: integer("created_at").default(sql`(unixepoch())`),
  },
  (t) => [index("sent_message_attachments_sent_idx").on(t.sentMessageId)]
);

export type Account = typeof accounts.$inferSelect;
export type OAuthApp = typeof oauthApps.$inferSelect;
export type Email = typeof emails.$inferSelect;
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
export type ComposeUpload = typeof composeUploads.$inferSelect;
export type SentMessage = typeof sentMessages.$inferSelect;
export type SentMessageAttachment = typeof sentMessageAttachments.$inferSelect;
