CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"credentials" text NOT NULL,
	"oauth_app_id" text,
	"preset_key" text,
	"auth_user" text,
	"imap_host" text,
	"imap_port" integer,
	"imap_secure" integer DEFAULT 1 NOT NULL,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_secure" integer DEFAULT 1 NOT NULL,
	"sync_cursor" text,
	"sync_read_back" integer DEFAULT 0 NOT NULL,
	"sync_star_back" integer DEFAULT 0 NOT NULL,
	"initial_fetch_limit" integer DEFAULT 200 NOT NULL,
	"last_synced_at" integer,
	"created_at" integer DEFAULT cast(extract(epoch from now()) as integer),
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "app_installation" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_github_id" text NOT NULL,
	"owner_github_login" text NOT NULL,
	"owner_user_id" text,
	"owner_github_name" text,
	"owner_github_avatar_url" text,
	"setup_completed_at" integer,
	"created_at" integer DEFAULT cast(extract(epoch from now()) as integer),
	"updated_at" integer DEFAULT cast(extract(epoch from now()) as integer)
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"email_id" text NOT NULL,
	"filename" text,
	"content_type" text,
	"size" integer,
	"r2_object_key" text NOT NULL,
	"created_at" integer DEFAULT cast(extract(epoch from now()) as integer)
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"github_id" text NOT NULL,
	"github_login" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compose_uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"r2_object_key" text NOT NULL,
	"created_at" integer DEFAULT cast(extract(epoch from now()) as integer)
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"remote_id" text,
	"message_id" text,
	"subject" text,
	"sender" text,
	"recipients" text,
	"snippet" text,
	"body_text" text,
	"body_html" text,
	"hydration_status" text DEFAULT 'metadata' NOT NULL,
	"hydrated_at" integer,
	"hydration_error" text,
	"is_read" integer DEFAULT 0,
	"is_starred" integer DEFAULT 0,
	"read_write_back_status" text DEFAULT 'idle' NOT NULL,
	"read_write_back_at" integer,
	"read_write_back_error" text,
	"star_write_back_status" text DEFAULT 'idle' NOT NULL,
	"star_write_back_at" integer,
	"star_write_back_error" text,
	"local_done" integer DEFAULT 0,
	"local_archived" integer DEFAULT 0,
	"local_snooze_until" integer,
	"local_labels" text DEFAULT '[]',
	"received_at" integer,
	"folder" text DEFAULT 'INBOX',
	"raw_headers" text,
	"created_at" integer DEFAULT cast(extract(epoch from now()) as integer)
);
--> statement-breakpoint
CREATE TABLE "oauth_apps" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"label" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text NOT NULL,
	"tenant" text,
	"created_at" integer DEFAULT cast(extract(epoch from now()) as integer)
);
--> statement-breakpoint
CREATE TABLE "sent_message_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"sent_message_id" text NOT NULL,
	"filename" text,
	"content_type" text,
	"size" integer,
	"r2_object_key" text NOT NULL,
	"created_at" integer DEFAULT cast(extract(epoch from now()) as integer)
);
--> statement-breakpoint
CREATE TABLE "sent_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider" text NOT NULL,
	"from_address" text NOT NULL,
	"to_recipients" text DEFAULT '[]' NOT NULL,
	"cc_recipients" text DEFAULT '[]' NOT NULL,
	"bcc_recipients" text DEFAULT '[]' NOT NULL,
	"subject" text,
	"snippet" text,
	"body_text" text,
	"body_html" text,
	"provider_message_id" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_at" integer NOT NULL,
	"created_at" integer DEFAULT cast(extract(epoch from now()) as integer)
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_message_attachments" ADD CONSTRAINT "sent_message_attachments_sent_message_id_sent_messages_id_fk" FOREIGN KEY ("sent_message_id") REFERENCES "public"."sent_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_messages" ADD CONSTRAINT "sent_messages_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_email_id_idx" ON "attachments" USING btree ("email_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_account_provider_account_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "auth_account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_user_github_id_idx" ON "user" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "auth_user_github_login_idx" ON "user" USING btree ("github_login");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_verification_identifier_value_idx" ON "verification" USING btree ("identifier","value");--> statement-breakpoint
CREATE INDEX "auth_verification_expires_at_idx" ON "verification" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "compose_uploads_created_idx" ON "compose_uploads" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "account_message_idx" ON "emails" USING btree ("account_id","message_id");--> statement-breakpoint
CREATE INDEX "emails_received_at_idx" ON "emails" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "emails_account_received_idx" ON "emails" USING btree ("account_id","received_at");--> statement-breakpoint
CREATE INDEX "emails_is_read_account_idx" ON "emails" USING btree ("is_read","account_id");--> statement-breakpoint
CREATE INDEX "emails_is_starred_received_idx" ON "emails" USING btree ("is_starred","received_at");--> statement-breakpoint
CREATE INDEX "emails_folder_received_idx" ON "emails" USING btree ("folder","received_at");--> statement-breakpoint
CREATE INDEX "emails_local_archived_received_idx" ON "emails" USING btree ("local_archived","received_at");--> statement-breakpoint
CREATE INDEX "emails_local_done_received_idx" ON "emails" USING btree ("local_done","received_at");--> statement-breakpoint
CREATE INDEX "emails_local_snooze_idx" ON "emails" USING btree ("local_snooze_until");--> statement-breakpoint
CREATE INDEX "emails_account_archive_received_idx" ON "emails" USING btree ("account_id","local_archived","received_at");--> statement-breakpoint
CREATE INDEX "emails_account_archive_starred_received_idx" ON "emails" USING btree ("account_id","local_archived","is_starred","received_at");--> statement-breakpoint
CREATE INDEX "emails_account_archive_read_received_idx" ON "emails" USING btree ("account_id","local_archived","is_read","received_at");--> statement-breakpoint
CREATE INDEX "emails_search_document_idx" ON "emails" USING gin (to_tsvector('simple', concat_ws(' ', coalesce("subject", ''), coalesce("sender", ''), coalesce("snippet", ''))));--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_apps_provider_label_idx" ON "oauth_apps" USING btree ("provider","label");--> statement-breakpoint
CREATE INDEX "oauth_apps_provider_created_idx" ON "oauth_apps" USING btree ("provider","created_at");--> statement-breakpoint
CREATE INDEX "sent_message_attachments_sent_idx" ON "sent_message_attachments" USING btree ("sent_message_id");--> statement-breakpoint
CREATE INDEX "sent_messages_account_sent_idx" ON "sent_messages" USING btree ("account_id","sent_at");--> statement-breakpoint
CREATE INDEX "sent_messages_sent_at_idx" ON "sent_messages" USING btree ("sent_at");